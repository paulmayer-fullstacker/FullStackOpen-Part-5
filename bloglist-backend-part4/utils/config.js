// utils/config.js:

// Read the .env file and load the key-value pairs into Node's global process.env object
require('dotenv').config()

const PORT = process.env.PORT

// if NODE_ENV === 'test', MONGODB_URI = TEST_MONGODB_URI. else MONGODB_URI = MONGODB_URI
const MONGODB_URI = process.env.NODE_ENV === 'test'
  ? process.env.TEST_MONGODB_URI
  : process.env.MONGODB_URI

// Export the configuration variables so other files can access them using require('./utils/config')
module.exports = {
  MONGODB_URI,
  PORT,
}