// tests/bloglist_api.test.js:
const assert = require('node:assert')   // Import Node's built-in assertion module.
const { test, describe, after, beforeEach } = require('node:test')  // Import test functions and hooks.
const mongoose = require('mongoose')  // Imports Mongoose to manage the database connection and model.
const supertest = require('supertest')  // Import Supertest for making HTTP requests to the Express app.
const app = require('../app')  // Import the main Express application instance 'app'.
const helper = require('./test_helper')  // Import test utility functions and data from tests/test_helper.js.
const bcrypt = require('bcrypt')
const User = require('../models/user')
const Blog = require('../models/blog')  // Import the Blog Mongoose Model.

const api = supertest(app)  // Create a Supertest agent, wrapping the Express app for making API calls.

let initialUser = null // Declare global for test user object.
let initialUserToken = null // Declare global for the JWT token.

beforeEach(async () => {  // Hook that runs before every test.
  await User.deleteMany({})
  await Blog.deleteMany({}) // Clear the test database to ensure tests are independent (run in a clean state).

  // create test user
  const passwordHash = await bcrypt.hash('password1234', 10)   // Hash the plaintext password with a salt round of 10.
  // bcrypt library generates a random 16-byte salt. The salt is combined with the plain-text password.
  // The combined string is run through the bcrypt hashing algorithem 2^saltRounds (2^10 = 1,024) times.
  const userToSave = new User({ // Create new User Mongoose document locally in memory.
    username: 'testauthor',    // Set username for the test user.
    name: 'Test Author',      // Set the display name
    passwordHash             // Assign the generated password hash.
  })
  initialUser = await userToSave.save() // Save the new user document to the database and store the saved object.
  const userId = initialUser._id       // Extract the Mongoose ID of the newly created user.

  // Log in Test Author to get a JWT token issued
  const loginResponse = await api   // Start API request (use Supertest agent).
    .post('/api/login')
    .send({
      username: initialUser.username,
      password: 'password1234' // Must match the password used in bcrypt.hash above
    })
    .expect(200)    // Expect HTTP status code of 200 (OK) on successful login.

  // Store the token for use in authenticated requests (create/delete blogs).
  initialUserToken = loginResponse.body.token

  // Load initial test blogs and assign user ids
  for (let blog of helper.listOfTestBlogs) {  // Iterates over the initial array of test blogs.
    const blogWithUser = { ...blog, user: userId } // Assign user Id here.
    let blogObject = new Blog(blogWithUser)   // Create a new Mongoose document for each blog.
    await blogObject.save()  // Save the blog document to the database.
  }  // This populates the database with known data before each test.
})

describe ('API Test Suite', () => {  // Starts the main test suite for the blogs API.

  describe ('Getting blogs', () => {  // Nested test suite for the GET /api/blogs route.
    test('blogs are returned as json', async () => {
      await api
        .get('/api/blogs')  // Makes a GET request to the blogs endpoint (handled by blogsRouter.get('/')).
        .expect(200)        // Expect the HTTP status code is 200 OK.
        .expect('Content-Type', /application\/json/)  // Expect the response content is in JSON format.
    })

    test('all blogs are returned', async () => {
      const response = await api.get('/api/blogs')  // Gets all blogs.
      assert.strictEqual(response.body.length, helper.listOfTestBlogs.length)  // Confirm the number of blogs is same as the number in listOfTestBlogs.
    })

    // Verify the unique identifier property is named 'id'
    test('returned blogs have "id" property rather than "_id" property', async () => {
      const response = await api.get('/api/blogs')
      // Get the first blog object from the response body
      const firstBlog = response.body[0]
      // Assert that the 'id' property exists
      assert.strictEqual(typeof firstBlog.id, 'string', 'The blog object should have a string property named id')
      // Assert that the '_id' property does NOT exist. The Mongoose toJSON function (models/blogs.js/blogSchema.set('toJSON'))
      // explicitly deletes the '_id' property (delete returnedObject._id) before sending the response. This assertion confirms that deletion was successful.
      assert.strictEqual(firstBlog._id, undefined, 'The blog object should NOT have the property named _id')
    })
  })

  describe ('posting a new blog', () => {  // Test suite for the POST /api/blogs route.
    test('a valid blog can be added', async () => {
      // Define the new blog object to be sent by retrieving it from the helper file
      const newBlog = { ...helper.additionalTestBlog, userId: initialUser.id }
      // Get the initial count of blogs from the database.
      const initialBlogs = await helper.currentBlogsInDb()
      const initialCount = initialBlogs.length
      // Make the POST request
      const response = await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${initialUserToken}`)
        .send(newBlog) // Send the new blog data in the request body.
        .expect(201) // Expect a 201 Created status code for successful creation.
        .expect('Content-Type', /application\/json/)
      // Capture and check the returned object
      const newlyCreatedBlog = response.body
      // Get the new list of blogs and verify the count
      const blogsAfterPost = await helper.currentBlogsInDb()
      const finalCount = blogsAfterPost.length
      // Assert that the total number of blogs increased by one
      assert.strictEqual(finalCount, initialCount + 1, 'Total number of blogs should increase by one')
      // Verify the content was saved correctly by checking the returned object.
      // The returned object will have a unique 'id', but the core properties should match the original.
      assert.strictEqual(newlyCreatedBlog.title, newBlog.title, 'The title should match the sent blog')
      assert.strictEqual(newlyCreatedBlog.url, newBlog.url, 'The URL should match the sent blog')
      assert.strictEqual(newlyCreatedBlog.likes, newBlog.likes, 'The likes should match the sent blog')
      assert.strictEqual(newlyCreatedBlog.user, initialUser.id, 'The user ID should be returned in the saved blog')
      // // Extract all titles from the newly fetched blogs  // No Longer Used. Test criteria not rigorous enough.
      // const titles = blogsAfterPost.map(b => b.title)
      // // Assert that the new blog's title is present in the database
      // assert.ok(titles.includes(newBlog.title), 'The newly added blog title should be in the database')
    })

    test('a blog missing the likes property defaults to 0 likes', async () => {
      // Get the blog object (without likes property) from the helper file
      const newBlog = {
        ...helper.testBlogWithoutLikes,
        userId: initialUser.id
      }
      // Make the POST request and capture the response
      const response = await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${initialUserToken}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)
      // Capture and verify returned object
      const newlyCreatedBlog = response.body
      // Assert that the 'likes' property exists and has defaulted to 0
      assert.strictEqual(newlyCreatedBlog.likes, 0, 'The likes property should default to 0 when missing from the request')
      // Verify the other properties are still correct for completeness
      assert.strictEqual(newlyCreatedBlog.title, newBlog.title, 'Title should be saved correctly')
      assert.strictEqual(newlyCreatedBlog.user, initialUser.id, 'The user ID should be returned in the saved blog') // Confirm user association (author now removed)
    })

    test('returns 400 Bad Request if title property is missing', async () => {
      const newBlog = {
        ...helper.testBlogWithoutTitle,
        user: initialUser.id
      }
      const initialCount = (await helper.currentBlogsInDb()).length
      // Make the POST request and expect 400
      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${initialUserToken}`)
        .send(newBlog)
        .expect(400) // Expect 400 Bad Request due to Mongoose validation error (handled by middleware via next(exception)).
      // Verify that the blog count has not changed (post not completed)
      const finalCount = (await helper.currentBlogsInDb()).length
      assert.strictEqual(finalCount, initialCount, 'Database count should not change after 400 error')
    })

    test('returns 400 Bad Request if url property is missing', async () => {
      const newBlog = {
        ...helper.testBlogWithoutURL,  // Missing required 'url' field.
        user: initialUser.id
      }
      const initialCount = (await helper.currentBlogsInDb()).length
      // Make the POST request and expect 400
      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${initialUserToken}`)
        .send(newBlog)
        .expect(400) // Expect 400 Bad Request due to Mongoose validation error.
      // Verify that the blog count has not changed (data was not saved)
      const finalCount = (await helper.currentBlogsInDb()).length
      assert.strictEqual(finalCount, initialCount, 'Database count should not change after 400 error')
    })

    // Test failure of unauthorized access (without token)
    test('returns 401 Unauthorized if token is missing', async () => {
      const newBlog = { ...helper.additionalTestBlog, userId: initialUser.id }

      await api
        .post('/api/blogs')
        // .set('Authorization', `Bearer ${initialUserToken}`)
        .send(newBlog)
        .expect(401)
        .expect(res => {
          assert(res.body.error === 'token missing', 'Error message should be "token missing"')
        })
    })
  })

  describe ('deletion of a blog', () => {  // Test suite for the DELETE /api/blogs/:id route.
    test('succeeds with status 204 if id/token is valid and user is owner', async () => {
      // Get the list of all blogs to select one to delete
      const blogsAtStart = await helper.currentBlogsInDb()
      // All blogs were created by initialUser in beforeEach. So, blogsAtStart[0] is owned by testauthor.
      const blogToDelete = blogsAtStart[0]
      // Make the DELETE request and expect 204.
      await api
        .delete(`/api/blogs/${blogToDelete.id}`)  // DELETE request to the route (handled by blogsRouter.delete('/:id')).
        .set('Authorization', `Bearer ${initialUserToken}`)
        .expect(204) // Expect 204 No Content for a successful deletion.

      // Verify the total count of blogs has decreased by one
      const blogsAtEnd = await helper.currentBlogsInDb()
      assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1, 'Total number of blogs should decrease by one')

      // Verify the deleted blog is no longer in the database
      const titles = blogsAtEnd.map(r => r.title)
      assert.ok(!titles.includes(blogToDelete.title), 'The deleted blog should no longer be in the database')
    })

    test('deletion is idempotent and returns 204 for a non-existent id', async () => {
      // Define a non-existent but correctly formatted Mongoose ID
      const nonExistentId = await helper.testBlogWithoutId() // Generates a valid but non-existent ID.
      const blogsAtStart = await helper.currentBlogsInDb()
      // Make the DELETE request with the non-existent ID. findByIdAndDelete returns null if the id is not found,
      // which does not throw an error. The route then successfully sends a 204.
      await api
        .delete(`/api/blogs/${nonExistentId}`)
        .set('Authorization', `Bearer ${initialUserToken}`)
        .expect(204) // Expect 204 No Content even if the resource wasn't found (Idempotency)

      // Verify the total count of blogs has NOT changed
      const blogsAtEnd = await helper.currentBlogsInDb()
      assert.strictEqual(blogsAtEnd.length, blogsAtStart.length, 'Total number of blogs should remain unchanged')
    })

    // Test for unauthorized access (without a token)
    test('returns 401 Unauthorized if token is missing', async () => {
      const blogsAtStart = await helper.currentBlogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        // .set('Authorization', `Bearer ${initialUserToken}`)
        .expect(401)
        .expect(res => {
          assert(res.body.error === 'token missing', 'Error message should be "token missing"')
        })

      const blogsAtEnd = await helper.currentBlogsInDb()
      assert.strictEqual(blogsAtEnd.length, blogsAtStart.length, 'Blog should not be deleted')
    })
  })

  describe('updating a blog', () => {  // Test suite for the PUT /api/blogs/:id route.
    test('succeeds with status 200 and updates the likes', async () => {
      // Get a blog to update
      const blogsAtStart = await helper.currentBlogsInDb()
      // Selects an existing blog from the database (first one returned and placed in blogsAtStart[0]).
      const blogToUpdate = blogsAtStart[0]
      // Calculate new likes value by taking the existing value and incrementing by 1
      const newLikesValue = blogToUpdate.likes + 1
      // Define the update object (only changing likes)
      const updatedData = {
        likes: newLikesValue,
      }
      // Make PUT request
      const response = await api
        .put(`/api/blogs/${blogToUpdate.id}`)  // PUT request (handled by blogsRouter.put('/:id')).
        .send(updatedData)
        .expect(200) // Expect 200 OK for a successful update.
        .expect('Content-Type', /application\/json/)
      // Confirm that the returned object has the new value
      assert.strictEqual(response.body.likes, newLikesValue, 'The returned blog should have the updated likes value')
      assert.strictEqual(response.body.title, blogToUpdate.title, 'Other fields should remain unchanged')
      // Verify the change is persisted in the database
      const blogsAtEnd = await helper.currentBlogsInDb()
      const updatedBlogInDb = blogsAtEnd.find(b => b.id === blogToUpdate.id)
      assert.strictEqual(updatedBlogInDb.likes, newLikesValue, 'The blog in the database should have the updated likes value')
    })

    test('returns 404 if the blog ID is valid but does not exist', async () => {
      // Get a valid but non-existent ID
      const nonExistentId = await helper.testBlogWithoutId()
      // Define a generic update object with no likes
      const updatedData = { likes: 0 }
      // Make the PUT request and expect 404
      await api
        .put(`/api/blogs/${nonExistentId}`)
        .send(updatedData)
        .expect(404) // Expect 404 Not Found (handled by the if (updatedBlog) check in the controller).
    })

    test('returns 400 if the blog ID is malformed (CastError)', async () => {
      const malformedId = '1234567890' // Not a valid 24-char hex string (MongoDB ID format).
      // Define a generic update object with 0 likes.
      const updatedData = { likes: 0 }
      // Make the PUT request and expect 400
      await api
        .put(`/api/blogs/${malformedId}`)
        .send(updatedData)
        .expect(400) // Expect 400 Bad Request due to CastError (handled by middleware via next(exception)).
    })

    test('returns 400 if validation fails (e.g., required field is set to null/empty string)', async () => {
      // Get a blog to update
      const blogsAtStart = await helper.currentBlogsInDb()
      const blogToUpdate = blogsAtStart[0]
      // Define an update object that violates the schema (e.g., title is required and is set to null). Our schema requires 'title' and 'url'.
      const invalidUpdateData = {
        title: null, // Attempting to clear a required field
        url: blogToUpdate.url,
        likes: blogToUpdate.likes,
      }
      // Make the PUT request and expect 400
      await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(invalidUpdateData)
        .expect(400) // Expect 400 Bad Request due to Validation Error (runValidators: true - set in the controller).
    })
  })

  describe('when there is initially only one user in db', () => {
    beforeEach(async () => {
      // Uses the imported User Model to clear the users collection in the database
      await User.deleteMany({})
      // Generate a secure hash for the initial user's password.
      const passwordHash = await bcrypt.hash('sekret', 10)
      const user = new User({ username: 'root', passwordHash })  // Create a new Mongoose document locally in memory.

      await user.save()  // Save the new user document (root) to the MongoDB users collection.
    })

    test('creation succeeds with a fresh username', async () => {
      const usersAtStart = await helper.usersInDb()  // Call the helper function to get the current list of users from the DB.

      const newUser = {
        username: 'mluukkai',
        name: 'Matti Luukkainen',
        password: 'salainen',
      }

      await api  // Supertest sends an HTTP POST request to the /api/users endpoint of the Express application (app).
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()  // The helper is called again to fetch the current list of users (now including the new user).
      assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)  // Asserts that the number of users in the DB has increased by one.

      const usernames = usersAtEnd.map(u => u.username)  // Extracts the usernames from the fetched list.
      assert(usernames.includes(newUser.username))  // Asserts that the new username is now present in the database.
    })

    test('creation fails with proper statuscode and message if username already taken', async () => {
      const usersAtStart = await helper.usersInDb()  // Get initial user count.

      const newUser = {  // Define user with an existing username ('root').
        username: 'root',
        name: 'Superuser',
        password: 'salainen',
      }

      const result = await api   // Send POST request.
        .post('/api/users')
        .send(newUser)
        .expect(400)   // Expect 400 Bad Request due to unique constraint violation.
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()  // Get final user count.
      // Assert that the error message includes the unique constraint warning for 'username'.
      assert(result.body.error.includes('expected `username` to be unique'))
      // Assert that the count remains unchanged.
      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    test('creation fails with status 400 and error message if password is missing', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'userwithnopassword',
        name: 'Passwordless User1',
        // password is intentionally missing
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)  // Expect 400 Bad Request.
        .expect('Content-Type', /application\/json/)
      // Assert the specific error message related to the missing or invalid password.
      assert(result.body.error.includes('Password must be provided and must be at least 3 characters long.'), 'Error message should state that password is missing')

      const usersAtEnd = await helper.usersInDb()
      assert.strictEqual(usersAtEnd.length, usersAtStart.length, 'Database count remains unchanged')
    })

    test('creation fails with status 400 and error message if password < 3 chars long', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'userwithshortpassword',
        name: 'Shortpassword User2',
        password: 'pw', // Too short (< 3 chars)
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)  // Expect 400 Bad Request.
        .expect('Content-Type', /application\/json/)
      // Assert error message related to the password being too short.
      assert(result.body.error.includes('Password must be provided and must be at least 3 characters long.'), 'Error message should state that password is too short')

      const usersAtEnd = await helper.usersInDb()
      assert.strictEqual(usersAtEnd.length, usersAtStart.length, 'Database count remains unchanged')
    })

    test('creation fails with status 400 and error message if username is < 3 chars long', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'us', // Too short (< 3 chars)
        name: 'Short User3',
        password: 'shortuserpassword',
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)  // Expect 400 Bad Request.
        .expect('Content-Type', /application\/json/)
      // Assert error message related to the username being too short.
      assert(result.body.error.includes('Username must be provided and must be at least 3 characters long.'), 'Error message should state that username is too short')

      const usersAtEnd = await helper.usersInDb()
      assert.strictEqual(usersAtEnd.length, usersAtStart.length, 'Database count remains unchanged')
    })

  })

  after(async () => {  // Hook that runs once after all tests in the suite are finished.
    await mongoose.connection.close()  // Close the Mongoose database connection.
  })
})