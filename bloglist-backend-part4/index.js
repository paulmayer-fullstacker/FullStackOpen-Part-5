// index.js
// Part 4 Exercises 4.1-4.7
const app = require('./app')             // Import the Express application.
const http = require('http')             // Import Node's built-in http module.
const config = require('./utils/config') // Import configuration variables exported from utils/config.js.
const mongoose = require('mongoose')     // Import the Mongoose library

const server = http.createServer(app)    // Create the raw HTTP server using the imported Express app to handle requests.

const PORT = config.PORT                 // Assign the server port from the imported configuration.

// MongoDB Connection

console.log('Connecting to MongoDB...')
// Initiate connection to MongoDB, using the URI from config.js. This returns a Promise.
mongoose.connect(config.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully!')

    // Server Start
    // Tell the HTTP server to start listening for traffic on the defined PORT.
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message)
    // Exit process if connection fails critically, with code of '1'.
    process.exit(1)
  })

// Export the HTTP server instance (useful for external processes like testing frameworks).
module.exports = server
