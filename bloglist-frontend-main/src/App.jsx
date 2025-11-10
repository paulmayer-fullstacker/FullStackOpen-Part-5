// App.jsx
import { useState, useEffect } from 'react'
import Blog from './components/Blog'
import blogService from './services/blogs'
import loginService from './services/login'
import Notification from './components/Notification'

const App = () => {
  const [blogs, setBlogs] = useState([])

  const [username, setUsername] = useState('') // For username input
  const [password, setPassword] = useState('') // For password input
  const [user, setUser] = useState(null)       // Store the logged-in user object

  // Creating new blog:
  const [newBlogTitle, setNewBlogTitle] = useState('')    // For blog title input
  const [newBlogAuthor, setNewBlogAuthor] = useState('')  // For blog author input
  const [newBlogUrl, setNewBlogUrl] = useState('')        // For blog URL input

  // Notification messages:
  const [notificationMessage, setNotificationMessage] = useState(null)
  const [notificationType, setNotificationType] = useState(null) // Stores 'success' or 'failure'

  // useEffect for initial blog fetch
  useEffect(() => {
    blogService.getAll().then(blogs =>
      setBlogs( blogs )
    )  
  }, [])

  // useEffect for session restoration (runs once)
  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedBloglistUser')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      setUser(user)
      blogService.setToken(user.token) // Set the token in the blog service.
      setNewBlogAuthor(user.name)      // Set the NewBlogAuthor, in case the user should want to create a new blog.
    }
  }, [])

  const showNotification = (message, type) => {
    setNotificationMessage(message)
    setNotificationType(type)
    // Clear the notification after 10 seconds (10000 milliseconds)
    setTimeout(() => {
      setNotificationMessage(null)
      setNotificationType(null)
    }, 10000)
  }

  const handleLogin = async event => {
    event.preventDefault()
     try {
      // Call the login service
      const user = await loginService.login({ username, password })
      // Persist the session to Local Storage
      window.localStorage.setItem(
        'loggedBloglistUser', JSON.stringify(user)
      ) 
      // Set the token for future authenticated API requests
      blogService.setToken(user.token) 
      // Update the component state
      setUser(user)
      setUsername('')
      setPassword('')
      // Show success notification on login
      showNotification(`Welcome, ${user.name}!`, 'success')
    } catch (exception) {
      // Display failure notification
      showNotification(
        'wrong username or password',
        'failure' // 'failure'
      )
      // Implement error notification
      console.error('Wrong credentials', exception)
      // setErrorMessage('wrong credentials')
      // setTimeout(() => {
      //   setErrorMessage(null)
      // }, 5000)
    }
  }
  // handleLogout(): Clear Local Storage & Reset State. [Logout Button]
 const handleLogout = () => {
  // Remove user data from Local Storage.
  window.localStorage.removeItem('loggedBloglistUser')
  // Clear the token from the blogService.
  blogService.setToken(null) 
  // Reset the user state, forcing a re-render to the login view.
  setUser(null)
}

  const handleCreateNewBlog = async (event) => {
    event.preventDefault() // Prevents default form submission/page reload
  
    const blogObject = {
      title: newBlogTitle,
      author: newBlogAuthor,
      url: newBlogUrl,
    }
  
    try {
      // Send the new blog object to the backend
      const returnedBlog = await blogService.create(blogObject)
      // Update local blogs state with the new blog
      setBlogs(blogs.concat(returnedBlog))
      // Show success notification.
      showNotification(
        // Using the client-side user.name state variable for the notificationDisplay as returnedBlog.user returnes user-Id only.
        `a new blog ${returnedBlog.title} by ${user.name} added`, 
        'success' // Success notification
      )
      // Clear the form fields
      setNewBlogTitle('')
      setNewBlogAuthor(user.name)  // Retain new blog author as user's name.
      setNewBlogUrl('')
      // Log success notification
      console.log(`Added new blog: ${returnedBlog.title}`)
  
    } catch (exception) {
      // Implement failure notification if creation fails
      showNotification('Blog creation failed. Please check your inputs.', 'failure')
      console.failure('Failed to create blog:', exception)
    }
  }

  // Conditional Rendering
  if (user === null) {
    return (
      <div>
        {/* Render Notification at the top */}
        <Notification message={notificationMessage} type={notificationType} />
        <h2>Log in to application</h2>
        
        <form onSubmit={handleLogin}> {/* Attach handler */}
          <div>
            username 
            <input
              type="text"
              value={username}
              name="Username"
              onChange={({ target }) => setUsername(target.value)} // Update state
            />
          </div>
          <div>
            password
            <input
              type="password"
              value={password}
              name="Password"
              onChange={({ target }) => setPassword(target.value)} // Update state
            />
          </div>
          <button type="submit">login</button>
        </form>
      </div>
    )
  }

  // This code runs only if user is logged in
  return (
    <div>
      {/* Render Notification at the top */}
      <Notification message={notificationMessage} type={notificationType} />
      <h2>blogs</h2>
      <p>
        {user.name} logged in <button onClick={handleLogout}>logout</button>
      </p>
      {/* Create New Blog Section */}
      <h2>create new</h2>
      <form onSubmit={handleCreateNewBlog}>
        <div>
          title:
          <input
            value={newBlogTitle}
            onChange={({ target }) => setNewBlogTitle(target.value)}
          />
        </div>
        <div>
          author:
          <input
            value={newBlogAuthor} readOnly
            // onChange={({ target }) => setNewBlogAuthor(target.value)}  //Removed as field is read-only.
            // Only logged in user can create a new blog and only in their own name. This guarantees correct ownership.
          />
        </div>
        <div>
          url:
          <input
            value={newBlogUrl}
            onChange={({ target }) => setNewBlogUrl(target.value)}
          />
        </div>
        <button type="submit">create</button>
      </form>

      {blogs.map(blog =>
        <Blog key={blog.id} blog={blog} />
      )}
    </div>
  )
}

export default App