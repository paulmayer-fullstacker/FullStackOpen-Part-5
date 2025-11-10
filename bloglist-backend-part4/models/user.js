// models/user.js
const mongoose = require('mongoose')  // Imports the Mongoose library.

const userSchema = new mongoose.Schema({
  username: {  // Defines the structure in MongoDB for the users collection, ensuring username is mandatory and unique.
    type: String,
    required: true,
    unique: true // Enforces uniqueness of username.
  },
  name: String,   // User's displayed name
  passwordHash: String,   // Stores the hashed version of the password
  blogs: [  // Define an array to store references to blogs authored by this user.
    {
      type: mongoose.Schema.Types.ObjectId,  // Specify that the array items are MongoDB ObjectIDs
      ref: 'Blog'    // Specify that the MongoDB ObjectIDs refer to documents in the 'Blog' model/collection.
    }
  ],
})
// Configuration format when the document is converted to JSON
userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()   // Rename the MongoDB primary key '_id' to 'id' (as a string, not object)
    delete returnedObject._id                           // Remove the original '_id' property.
    delete returnedObject.__v                           // Remove the Mongoose version key '__v'.
    delete returnedObject.passwordHash                  // Ensures the password hash is never sent in responses.
  }
})

const User = mongoose.model('User', userSchema)        // Creates the Mongoose model based on the schema, allowing database interactions.

module.exports = User    // Exports User model for use in controllers.