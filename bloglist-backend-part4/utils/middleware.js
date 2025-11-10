// utils/middleware.js:
const jwt = require('jsonwebtoken')
const User = require('../models/user') // Import User model

// Basic error handling middleware - Define a middleware function named errorHandler.
// errorHandler takes four standard Express error-handling middleware arguments: error, request, response, and next.
const errorHandler = (error, request, response, next) => {
  console.error(error.message) // Log the specific error message to the console for server-side debugging.
  // Checks if the error is a 'CastError'. Example when an ID format is invalid (e.g., using a badly formatted ID string to GET a MongoDB document).
  if (error.name === 'CastError') {
    // If CastError, sets the status to 400 (Bad Request), and send a JSON response indicating a malformatted ID.
    // The 'return' stops further execution of the middleware for this request.
    return response.status(400).send({ error: 'malformatted id' })
    // ELSE: Checks if the error is a 'ValidationError' - If data fails Mongoose schema validation rules (e.g., a required field is missing).
  } else if (error.name === 'ValidationError') {
    // If ValidationError, sets the status to 400 (Bad Request), and send a JSON response with the specific validation error message provided by Mongoose.
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
    return response.status(400).json({ error: 'expected `username` to be unique' })
    // Handle JsonWebTokenError exception. Due to missing or invalid token
  } else if (error.name ===  'JsonWebTokenError') {
    return response.status(401).json({ error: 'token invalid' })
  }
  // If error not handled by CastError or ValidationError, pass the error on to the default Express error handler.
  next(error)
}

// Handler for requests made to unknown endpoints (routes that don't exist).
// Placed as the last route to catch any requests that fell through all the specific route handlers
const unknownEndpoint = (request, response) => {
  // Set the HTTP status code to 404 (Not Found). Send a JSON response body indicating the error.
  response.status(404).send({ error: 'unknown endpoint' })
}

// JWT Token Extractor
const tokenExtractor = (request, response, next) => {
  // Get the Authorization header
  const authorization = request.get('authorization')
  // Check if correct "Authorization: Bearer {{authToken}}" format
  if (authorization && authorization.startsWith('Bearer ')) {
    // Extract the token and attach it to the request object
    request.token = authorization.replace('Bearer ', '')
  } else {
    request.token = null // If no token or invalid format, set request.token to null/undefined. Do not throw error here.
    //  The route handler will perform token validation (jwt.verify), and send error code as necessary.
  }
  // Continue to the next middleware (userExtractor).
  next()
}

// User Extractor (from token).
const userExtractor = async (request, response, next) => {
  // Run AFTER tokenExtractor, to ensure that request.token is present.
  if (!request.token) {
    // // If no token is present, function proceeds, but user will be null/undefined.
    // // In POST/DELETE routes (where this is used), a token is required. So, jwt.verify will handle the missing/invalid token error (below).
    // return next()  //**THIS CAUSES ISSUES IN TESTING. UNABLE TO DISTINGUISH NO-TOKEN STATE AND TOKEN WITH NO ID STATE **//
    // So, if no token is present, return the 401 error here.
    return response.status(401).json({ error: 'token missing' }) // NOT: token invalid
  }
  try {
    // Verify token using the secret.
    const decodedToken = jwt.verify(request.token, process.env.SECRET)

    // if the decoded token does not contain a valid userId.
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' })
    }
    // Find the user in the database using the ID from the token.
    const user = await User.findById(decodedToken.id)
    // If the token is valid but the user no longer exists in DB
    if (!user) {
      return response.status(404).json({ error: 'User associated with token not found' })
    }
    // Attach user object to the request, for the route handler to use.
    request.user = user
    // Continue to the route handler.
    next()
  } catch (error) {
    // Handle errors from jwt.verify (e.g., token expired, token invalid structure). Pass to errorHandler middleware
    next(error)
  }
}

// Exports the functions so they can be imported and used in other files (app.js file).
module.exports = {
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
}
