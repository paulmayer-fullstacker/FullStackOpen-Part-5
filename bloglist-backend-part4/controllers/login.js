// // controlers/login.js:
const jwt = require('jsonwebtoken')       // Import jsonwebtoken library (for creating tokens).
const bcrypt = require('bcrypt')          // Import bcrypt (for comparing hashed passwords).
const loginRouter = require('express').Router()   // Creates a new Express router for login routes.
const User = require('../models/user')    // Imports the User model (for database interaction).
// Define route handler for HTTP POST requests to the base path (e.g., /api/login).
loginRouter.post('/', async (request, response) => {
  const { username, password } = request.body  // Destructure username and password from request.body.
  // Finds user in database matching the provided username.
  const user = await User.findOne({ username })
  // Checks if the user was found AND compares the provided password with the stored hash.
  const passwordCorrect = user === null
    ? false   // If user is null (not found), passwordCorrect is false.
    : await bcrypt.compare(password, user.passwordHash)
  // If user not found OR password is incorrect, respond 401 Unauthorized.
  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid username or password'
    })
  }
  // Define the user data payload to be encoded into the JWT.
  const userForToken = {
    username: user.username,
    id: user._id,
  }
  // Create the JWT using the payload and the secret key from environment variables.
  const token = jwt.sign(userForToken, process.env.SECRET)
  // Sends 200 OK response with the generated token and the user's details (username, name).
  response
    .status(200)
    .send({ token, username: user.username, name: user.name })
})
// Export the login router.
module.exports = loginRouter