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


export default { 
  getAll,
  create,
  update,
  setToken
}