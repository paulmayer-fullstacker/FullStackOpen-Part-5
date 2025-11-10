// tests/test_helper.js:
const mongoose = require('mongoose')  // Imports the Mongoose library, for MongoDB object modeling.
const Blog = require('../models/blog')   // Import the Blog Mongoose Model
const User = require('../models/user')
// An array of blogs to initialize the test database before API tests (in bloglist_api.test.js).
const listOfTestBlogs = [
  {
    title: 'Test Blog No 1',
    url: 'https://test-bloglist.com/',
    likes: 7,
    user: null // Placeholder for the required User ID
  },
  {
    title: 'Test Blog No 2',
    url: 'https://test-bloglist.com/',
    likes: 5,
    user: null // Placeholder for the required User ID
  },
  {
    title: 'Test Blog No 3',
    url: 'https://test-bloglist.com/',
    likes: 12,
    user: null // Placeholder for the required User ID
  }]
// Blog object used specifically for successful POST request tests.
const additionalTestBlog =
  {
    title: 'Additional Test Blog No 1',
    url: 'https://test-bloglist.com/',
    likes: 7,
    user: null // Placeholder for the required User ID
  }
// Blog object without likes, for testing the 'likes' default value on POST requests.
const testBlogWithoutLikes =
  {
    title: 'Additional Test Blog No 1',
    url: 'https://test-bloglist.com/',
    user: null // Placeholder for the required User ID
  }
// Blog object without a title, for testing the required 'title' validation on POST requests.
const testBlogWithoutTitle =
  {
    url: 'https://test-bloglist.com/',
    likes: 7,
    user: null // Placeholder for the required User ID
  }
// Blog object without a URL, for testing the required 'url' validation on POST requests.
const testBlogWithoutURL =
  {
    title: 'Additional Test Blog No 1',
    likes: 7,
    user: null // Placeholder for the required User ID
  }

// Utility function to generate a valid Mongoose ID that will not to exist in the database.
// This is the cleanest way and avoids the validation error that caused the hang.
const testBlogWithoutId = async () => {
  return new mongoose.Types.ObjectId().toString()
}

// Function to fetch all blogs directly from the database for verifying API side-effects.
const currentBlogsInDb = async () => {
  const blogs = await Blog.find({})  // Fetches all documents using the Mongoose Model
  return blogs.map(blog => blog.toJSON())  // Converts each Mongoose document to a plain JavaScript object with toJSON applied.
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}
// Export test data and utility functions for use in bloglist_api.test.js.
module.exports = {
  listOfTestBlogs,
  additionalTestBlog,
  testBlogWithoutLikes,
  testBlogWithoutTitle,
  testBlogWithoutURL,
  currentBlogsInDb,
  testBlogWithoutId,
  usersInDb
}