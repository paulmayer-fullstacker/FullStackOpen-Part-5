// App.jsx
import { useState, useEffect, useRef } from 'react'
import Blog from './components/Blog'
import blogService from './services/blogs'
import loginService from './services/login'
import Notification from './components/Notification'
import Togglable from './components/Togglable'
import BlogForm from './components/BlogForm'

const App = () => {
  const [blogs, setBlogs] = useState([])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)

  // Notification messages:
  const [notificationMessage, setNotificationMessage] = useState(null)
  const [notificationType, setNotificationType] = useState(null)

  // Create a ref for the Togglable component
  const blogFormRef = useRef()

  const showNotification = (message, type) => {
    setNotificationMessage(message)
    setNotificationType(type)
    setTimeout(() => {
      setNotificationMessage(null)
      setNotificationType(null)
    }, 10000)
  }

  // --- FIX: Logic to handle fetching blogs ---
  const fetchBlogs = async () => {
    try {
      const initialBlogs = await blogService.getAll()
      // Optional: Add a safety map here if backend populating fails, but we rely on the backend being fixed/seeded now.
      setBlogs(initialBlogs)
    } catch (error) {
      console.error('Failed to fetch blogs:', error)
      // Optional: show a failure notification
    }
  }

  // useEffect for session restoration (runs once on load)
  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedBloglistUser')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      setUser(user)
      blogService.setToken(user.token)
      // Call fetchBlogs immediately after setting the user/token
      fetchBlogs()
    } else {
      // If no user is logged in, still fetch blogs (without token)
      fetchBlogs()
    }
  }, [])

  // NOTE: The original initial blog fetch useEffect is removed, as it's now handled
  // by the session restoration/initial load logic above (via the call to fetchBlogs).
  
  // Login handler
  const handleLogin = async event => {
      event.preventDefault()
      try {
      const user = await loginService.login({ username, password })
      window.localStorage.setItem(
        'loggedBloglistUser', JSON.stringify(user)
      )
      blogService.setToken(user.token)
      setUser(user)
      setUsername('')
      setPassword('')
      showNotification(`Welcome, ${user.name}!`, 'success')
      
      // FIX: Fetch blogs again immediately after a successful login
      fetchBlogs()

    } catch (exception) {
      showNotification(
        'wrong username or password',
        'failure'
      )
      console.error('Wrong credentials', exception)
    }
  }

  // Logout handler
  const handleLogout = () => {
    window.localStorage.removeItem('loggedBloglistUser')
    blogService.setToken(null)
    setUser(null)
    // Clear blogs or re-fetch as anonymous user might be desired
    setBlogs([]) // Clear list to force a clean slate until next fetch
    fetchBlogs() // Re-fetch as anonymous user
  }

  // Blog creation handler
  const handleCreateNewBlog = async (blogObject) => {
    try {
      const returnedBlog = await blogService.create(blogObject)

      // The backend should return the populated user object, so we rely on that.
      // We no longer manually construct the user object here, as the backend populates it.
      
      // Update local blogs state with the new blog
      setBlogs(blogs.concat(returnedBlog))

      // Hide the form using the ref.
      blogFormRef.current.toggleVisibility()

      showNotification(
        `a new blog ${returnedBlog.title} by ${user.name} added`,
        'success'
      )
      console.log(`Added new blog: ${returnedBlog.title}`)

    } catch (exception) {
      showNotification('Blog creation failed. Please check your inputs.', 'failure')
      console.error('Failed to create blog:', exception)
    }
  }

  // Handler for the 'Like' button click (No changes needed)
  const handleLike = async (blogId) => {
    try {
      const updatedBlog = await blogService.like(blogId)
      setBlogs(blogs.map(blog =>
        blog.id === blogId
          ? updatedBlog
          : blog
      ))
      showNotification(
        `Liked blog: ${updatedBlog.title}. New likes: ${updatedBlog.likes}`,
        'success'
      )
    } catch (exception) {
      showNotification('Failed to like the blog.', 'failure')
      console.error('Failed to like blog:', exception)
    }
  }

  // Handler for the 'Remove' button click (No changes needed)
  const handleRemove = async (blog) => {
    const confirmed = window.confirm(`Remove blog ${blog.title} by ${blog.user.name || blog.user.username}?`)
    if (confirmed) {
      try {
        await blogService.remove(blog.id)
        setBlogs(blogs.filter(b => b.id !== blog.id))

        showNotification(
          `Successfully removed blog: ${blog.title}`,
          'success'
        )
      } catch (exception) {
        showNotification('Failed to delete the blog. Only the creator can delete a blog.', 'failure')
        console.error('Failed to delete blog:', exception)
      }
    }
  }

  // Conditional Rendering for Login Form (no changes needed here)
  if (user === null) {
    return (
      <div>
        <Notification message={notificationMessage} type={notificationType} />
        <h2>Log in to application</h2>

        <form onSubmit={handleLogin}>
          {/* ... login inputs ... */}
          <div>
            username
            <input type="text" value={username} name="Username"
              onChange={({ target }) => setUsername(target.value)} />
          </div>
          <div>
            password
            <input type="password" value={password} name="Password"
              onChange={({ target }) => setPassword(target.value)} />
          </div>
          <button type="submit">login</button>
        </form>
        
        {/* Render blogs here for anonymous users if they exist */}
        {blogs.length > 0 && <h3>Available Blogs (Anonymous)</h3>}
        {blogs.map(blog => 
            <Blog
                key={blog.id}
                blog={blog}
                // No like/remove handlers for anonymous view
            />
        )}
      </div>
    )
  }

  // Sort the blogs array by likes in descending order.
  // The use of || 0 prevents crashes if 'likes' is missing or null.
  const sortedBlogArray = [...blogs].sort((a, b) => (b.likes || 0) - (a.likes || 0))

  // Logged-in view
  return (
    <div>
      <Notification message={notificationMessage} type={notificationType} />
      <h2>blogs</h2>
      <p>
        {user.name} logged in <button onClick={handleLogout}>logout</button>
      </p>

      <Togglable buttonLabel="create new blog" ref={blogFormRef}>
        <BlogForm
          createBlog={handleCreateNewBlog}
          authorName={user.name}
        />
      </Togglable>

      {/* Blog List */}
      {sortedBlogArray.map(blog =>
        <Blog
          key={blog.id}
          blog={blog}
          handleLike={handleLike}
          handleRemove={handleRemove}
          currentUser={user}
        />
      )}
    </div>
  )
}
export default App