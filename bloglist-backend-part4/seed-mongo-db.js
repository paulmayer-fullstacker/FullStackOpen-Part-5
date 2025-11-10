// seed-mongo-db.js:
const mongoose = require('mongoose')   // Import Mongoose for database connection and schema interaction.
const bcrypt = require('bcrypt')       // Import bcrypt for hashing user passwords.
const Blog = require('./models/blog')  // Assumes your Blog model is at ../models/blog.js
const User = require('./models/user')  // Assumes your User model is at ../models/user.js
const config = require('./utils/config') // Assumes your config (including MONGODB_URI) is at ../utils/config.js
const multiUserData = require('./utils/seeding_data') // Import the test data file

// Execute the database seeding process.
const seedDatabase = async () => {  // Define main asynchronous function to handle seeding.
  try {
    console.log('Connecting to MongoDB...')
    // Use URI from config file for the connection
    await mongoose.connect(config.MONGODB_URI)  // Connect to MongoDB using the URI from the config file.
    console.log('Connected to MongoDB successfully.')

    // Clear Existing Data ---
    console.log('Clearing existing users and blogs...')
    await User.deleteMany({})  // Delete all documents in the xxx collection for a clean start.
    await Blog.deleteMany({})
    console.log('Database cleared.')

    // Seed Users
    console.log('Seeding users...')
    const savedUsers = []   // Initialize an array to hold the successfully saved user documents.
    const userMap = new Map() // Initialize a Map to store username -> Mongoose ID for linking.
    for (const user of multiUserData.testUsers) {  // Iterate through the raw user data imported from `seeding_data`.
      const passwordHash = await bcrypt.hash(user.password, 10)  // Hash the plaintext password with a salt round of 10.
      // bcrypt library generates a random 16-byte salt. The salt is combined with the plain-text password.
      // The combined string is run through the bcrypt hashing algorithem 2^saltRounds (2^10 = 1,024) times.
      const userObject = new User({  // Create a new Mongoose User document object.
        username: user.username,
        name: user.name,
        passwordHash: passwordHash
      })
      // Save the new user document to the database.
      const savedUser = await userObject.save()
      savedUsers.push(savedUser)  // Add the saved user document to the array.
      userMap.set(savedUser.username, savedUser._id) // Store ID for linking
    }
    console.log(`Seeded ${savedUsers.length} users.`)

    // Seed Blogs and Link to Users
    console.log('Seeding blogs and linking them to users...')
    const blogPromises = multiUserData.multiUserBlogs.map(blog => {  // Map the raw blog data array to an array of save Promises.
      // Find the correct user ID using the stored map
      const userId = userMap.get(blog.ownerUsername)   // Retrieve the Mongoose ID of the owner using the temporary username key.
      if (!userId) {  // Throw an error if the owner userId is invalid.
        throw new Error(`User not found for blog owner: ${blog.ownerUsername}`)
      }

      // Create the blog document, replacing ownerUsername with the actual Mongoose ID
      const blogWithUser = { ...blog, user: userId }  // Create a new object: copy blog data and add the correct `user` ID.
      delete blogWithUser.ownerUsername // Remove the temporary key
      return new Blog(blogWithUser).save()  // Create a Mongoose Blog document and return the save Promise.
    })
    // Wait for all blog save Promises to resolve, inserting all blogs concurrently.
    const savedBlogs = await Promise.all(blogPromises)
    console.log(`Seeded ${savedBlogs.length} blogs.`)

    // Update Users with Blog IDs
    console.log('Updating user documents with associated blog IDs...')

    // Group the new Blog IDs by their owner's User ID
    const userBlogUpdates = new Map() // Key: User ID (string), Value: Array of Blog IDs
    // Iterate through the newly saved blog documents.
    savedBlogs.forEach(blog => {
      const userIdString = blog.user.toString()   // Convert Mongoose ID to string for map key
      if (!userBlogUpdates.has(userIdString)) {  // Check if an entry for this user ID already exists.
        userBlogUpdates.set(userIdString, [])   // If not, initialize the value as an empty array of blog IDs.
      }
      // Push the current blog's new ID into the corresponding user's blog array.
      userBlogUpdates.get(userIdString).push(blog._id)
    })

    // Create the update promises for each user
    const userUpdatePromises = []  // Initialize array to store the Promises for user update operations.
    userBlogUpdates.forEach((blogIds, userId) => {   // Iterate over the map entries (each entry is a user and their newly created blogs).
      // Use $push with $each to add all collected blog IDs to the user's 'blogs' array
      userUpdatePromises.push(  // Push the Mongoose update Promise into the array.
        User.updateOne(
          { _id: userId },  // Find the user document by their ID.
          { $push: { blogs: { $each: blogIds } } }  // Use the `$push` operator with `$each` to efficiently append multiple blog IDs to the `blogs` array.
        )
      )
    })

    // Execute all user updates
    await Promise.all(userUpdatePromises)  // Execute all user update promises concurrently.
    console.log('User documents updated successfully.')

  } catch (error) {   // Catch and log any errors that occurred during `try` block
    console.error('DATABASE SEEDING FAILED:', error.message)
    process.exit(1)  // Exit Node process with error code 1 (failure).
  } finally {
    // Close Connection
    if (mongoose.connection.readyState === 1) {    // if the Mongoose connection is still open (ready state 1).
      await mongoose.connection.close()   // Close the MongoDB connection cleanly.
      console.log('MongoDB connection closed.')
    }
  }
}

seedDatabase()
