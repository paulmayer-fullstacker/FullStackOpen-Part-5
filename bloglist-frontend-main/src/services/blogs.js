// services/blogs.js:
import axios from 'axios'     // Import the Axios library. For making HTTP requests.
const baseUrl = '/api/blogs'  // Define base URL for the blog list API endpoint.

let token = null  // Initialise module variable to store the JWT

const setToken = newToken => {   // Function to set/update the token received from login
  token = `Bearer ${newToken}`   // Store the token prefixed with 'Bearer ' for Authorization headers.
}

const getAll = () => {                            // Function to fetch all blogs from the server.
  const request = axios.get(baseUrl)              // Make  GET request to the base URL
  return request.then(response => response.data)  // Return a promise that resolves with the data from the response.
}

const create = async newObject => {              // Function to create a new blog post (requires authentication).
  const config = {                               // Configuration object for the request.
    headers: { Authorization: token }            // Set the Authorization header using the stored JWT token.
  }
  const response = await axios.post(baseUrl, newObject, config)  // Send POST request with the new blog data and authorization header.
  return response.data                                           // Return the newly created blog data from the response.
}

const update = (id, newObject) => {                              // Function to update an existing blog (entire new Object is put/replaced).
  const request = axios.put(`${baseUrl}/${id}`, newObject)       // Send a PUT request to update the blog by ID.
  return request.then(response => response.data)                 // Return promise that resolves with the updated blog data.
}

const like = async (id) => {                                     // Atomic update function (only updates 'like'), for specific blog, by ID.
  const response = await axios.put(`${baseUrl}/${id}/like`)      // Send PUT request to dedicated 'like' endpoint: /api/blogs/:id/like
  return response.data
}

const remove = async (id) => {                                   // Function to remove (delete) a blog post
  const config = {
    headers: { Authorization: token } // Pass JWT token for authentication. Only authenticated users (the creator) can delete subject blog.
  }
  const response = await axios.delete(`${baseUrl}/${id}`, config)  // Send a DELETE request to the specific blog ID with the authorization header.
  return response.data                                             // Return the response data (often an empty object or status message).
}


export default {          // Export the service functions for use in the main application (App.jsx).
  getAll,
  create,
  update,
  like,
  remove,
  setToken
}