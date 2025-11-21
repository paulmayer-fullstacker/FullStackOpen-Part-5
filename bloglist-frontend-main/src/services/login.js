// services/login.js:
import axios from 'axios'
const baseUrl = '/api/login' // Backend login endpoint

const login = async credentials => {
  const response = await axios.post(baseUrl, credentials)
  return response.data // Returns user object (e.g., { token, username, name })
}

export default { login }