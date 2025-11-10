// models/blog.js:
// Mongoose Model Definition
const mongoose = require('mongoose')  // Imports the Mongoose library, for MongoDB object modeling.
// Define the Blog Schema
const blogSchema = new mongoose.Schema({
  // Define the structure for the Blog documents in the MongoDB collection.
  title: {
    type: String,
    required: true,  // Mongoose validation ensures 'title' must be present for creation/update.
  },
  // author: String,  // Superseded by the 'user' attribute
  url: {
    type: String,
    required: true,  // 'url' must be present.
  },
  likes: {
    type: Number,
    default: 0, // Set default likes to 0 if not provided.
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true, // A blog MUST have an author
  }
})

// Transform the document object before sending as JSON
blogSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()  // Rename the MongoDB default primary key _id to id.
    delete returnedObject._id                          // Remove the original _id field.
    delete returnedObject.__v                          // Removes the Mongoose version key (__v).
  },
})

// Model Creation: Compile the schema into a reusable model named Blog, used for database operations.
const Blog = mongoose.model('Blog', blogSchema)
// Export the Blog Mongoose Model so it can be used by other modules (in the controllers and tests).
module.exports = Blog