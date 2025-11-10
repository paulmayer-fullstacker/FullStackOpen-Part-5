// controllers/users.js:
const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
// The Express route handler receives the request, hashes the newUser.password,
// and creates a new User document in the database.
usersRouter.post('/', async (request, response, next) => {
  const { username, name, password } = request.body

  // Basic validation to meet test requirements
  if (!password || password.length < 3) {
    return response.status(400).json({
      error: 'Password must be provided and must be at least 3 characters long.'
    })
  }
  // Validate username length (username.length > 3 chars)
  if (!username || username.length < 3) {
    return response.status(400).json({
      error: 'Username must be provided and must be at least 3 characters long.'
    })
  }
  // saltRounds parameter controls the level of security, and the computational cost, of the hashing process.
  const saltRounds = 10
  try {
    const passwordHash = await bcrypt.hash(password, saltRounds)
    // bcrypt library generates a random 16-byte salt. The salt is combined with the plain-text password.
    // The combined string is run through the bcrypt hashing algorithem 2^saltRounds (2^10 = 1,024) times.
    const user = new User({
      username,
      name,
      passwordHash,
    })

    const savedUser = await user.save()
    // Successful creation returns a 201 Created status code.
    response.status(201).json(savedUser)
  } catch (exception) {
    // This block handles uniqueness constraint errors from MongoDB, which the error handling middleware should translate into a 400 Bad Request.
    next(exception) // Pass error (like unique constraint violation) to middleware
  }
})
// // Route handler retrieves all users from the database.
usersRouter.get('/', async (request, response) => {
  const users = await User
    // Find all documents in the User collection.
    .find({}).populate('blogs', { title: 1, url: 1, likes: 1 })
    // Populate the 'blogs' field. Tells Mongoose to replace the array of Blog IDs stored in the User document with the actual Blog documents from the Blog collection.
    // The second argument { title: 1, url: 1, likes: 1 } limits the fields returned for each blog object.
  response.json(users)
})

module.exports = usersRouter