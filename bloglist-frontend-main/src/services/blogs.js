// services/blogs.js:
import axios from 'axios'
const baseUrl = '/api/blogs'
// Module variable to store the JWT
let token = null
// Function to set the token received from login
const setToken = newToken => {
  token = `Bearer ${newToken}`
}

const getAll = () => {
  const request = axios.get(baseUrl)
  return request.then(response => response.data)
}

const create = async newObject => {
  const config = {
    headers: { Authorization: token } 
  }
  const response = await axios.post(baseUrl, newObject, config)
  return response.data
}

const update = (id, newObject) => {
  const request = axios.put(`${baseUrl}/${id}`, newObject)
  return request.then(response => response.data)
}

// Function to 'like' specific blog.
const like = async (id) => {
  // Use dedicated 'like' endpoint: /api/blogs/:id/like
  const response = await axios.put(`${baseUrl}/${id}/like`) 
  return response.data
}

// Function to remove (delete) a blog post
const remove = async (id) => {
  const config = {
    headers: { Authorization: token } // Pass JWT token for authentication. Only authenticated users (the creator) can delete subject blog.
  }
  // Send DELETE request to the backend
  const response = await axios.delete(`${baseUrl}/${id}`, config)
  return response.data
}


export default { 
  getAll,
  create,
  update,
  like,
  remove,
  setToken
}