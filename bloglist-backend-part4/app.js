// app.js:
const express = require('express')       // Imports Express framework.
const mongoose = require('mongoose')      // Import Mongoose
const blogsRouter = require('./controllers/blogs') // Import the router module from blogs.js
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const middleware = require('./utils/middleware')  // Imports the error handlers, exported from middleware.js.
const config = require('./utils/config') // Import config to get MONGODB_URI

const app = express()  // Initialization: Create the core Express application object.

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    //logger.info('connected to MongoDB')
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    //logger.error('error connection to MongoDB:', error.message)
    console.error('error connecting to MongoDB:', error.message)
  })

// Middleware
// Tell Express to use the built-in JSON parser.
// This middleware parses incoming requests with JSON payloads (i.e., frm POST requests) and makes the data available on request.body.
app.use(express.json())

// Use the tokenExtractor middleware globally
app.use(middleware.tokenExtractor) // All routes below this line will have request.token set

// Route Mounting
// All requests to /api/blogs are passed to the blogsRouter,
app.use('/api/blogs', blogsRouter)
// all requests to /api/users passed to the usersRouter,
app.use('/api/users', usersRouter)
// and requests to /api/login passed to the loginRouter.
app.use('/api/login', loginRouter)

// Error Handling Middleware (MUST be loaded last)

// Handler for requests to non-existent endpoints (404 Not Found)
app.use(middleware.unknownEndpoint)

// Handler for errors (e.g., CastError, ValidationError)
app.use(middleware.errorHandler)


// Export the configured Express application instance. Then index.js can start the server using it.
module.exports = app