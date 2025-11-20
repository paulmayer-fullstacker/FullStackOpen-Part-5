// App.jsx
import { useState, useEffect, useRef } from 'react' // Import useRef
import Blog from './components/Blog'
import blogService from './services/blogs'
import loginService from './services/login'
import Notification from './components/Notification'
import Togglable from './components/Togglable' // Import Togglable
import BlogForm from './components/BlogForm'   // Import BlogForm

const App = () => {
  const [blogs, setBlogs] = useState([])

  const [username, setUsername] = useState('') 
  const [password, setPassword] = useState('') 
  const [user, setUser] = useState(null) 

  // Notification messages:
  const [notificationMessage, setNotificationMessage] = useState(null)
  const [notificationType, setNotificationType] = useState(null) 

  // 1. Create a ref for the Togglable component
  // This allows the parent (App) to call the toggleVisibility function defined inside Togglable.
  const blogFormRef = useRef()

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
      blogService.setToken(user.token) 
      // The state variables for new blog inputs are now in BlogForm.jsx, 
      // so we remove the redundant setNewBlogAuthor(user.name) here.
    }
  }, [])

  const showNotification = (message, type) => {
    setNotificationMessage(message)
    setNotificationType(type)
    setTimeout(() => {
      setNotificationMessage(null)
      setNotificationType(null)
    }, 10000)
  }

  // Login handler (no changes needed here)
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
    } catch (exception) {
      showNotification(
        'wrong username or password',
        'failure'
      )
      console.error('Wrong credentials', exception)
    }
  }
  
  // Logout handler (no changes needed here)
  const handleLogout = () => {
    window.localStorage.removeItem('loggedBloglistUser')
    blogService.setToken(null) 
    setUser(null)
  }

  // 2. Updated blog creation handler, now receiving the blogObject directly from BlogForm
  const handleCreateNewBlog = async (blogObject) => {
    try {
      // Send the new blog object to the backend
      const returnedBlog = await blogService.create(blogObject)

      // Guaranteed to contain the 'id' and 'name' fields required for frontend logic.
      const blogWithUser = { 
          ...returnedBlog, 
          user: { id: user.id, name: user.name, username: user.username } 
      }
      
      // Update local blogs state with the new blog
      setBlogs(blogs.concat(blogWithUser))
      
      // 3. Hide the form using the ref. This is key for the requirement.
      // If the ref exists and has the necessary method (which Togglable provides via useImperativeHandle), call it.
      blogFormRef.current.toggleVisibility()

      // Show success notification.
      showNotification(
        `a new blog ${returnedBlog.title} by ${user.name} added`, 
        'success'
      )
      console.log(`Added new blog: ${returnedBlog.title}`)
 
    } catch (exception) {
      // Implement failure notification if creation fails
      showNotification('Blog creation failed. Please check your inputs.', 'failure')
      console.error('Failed to create blog:', exception)
    }
  }

  // Handler for the 'Like' button click
const handleLike = async (blogId) => {
  try {
    // 1. Call the service function to update the like count on the backend
    const updatedBlog = await blogService.like(blogId)
    
    // 2. Update the local state (blogs) to display the change immediately
    // Map over the existing blogs array: if the blog ID matches, replace it with the updatedBlog returned from the server.
    setBlogs(blogs.map(blog => 
      blog.id === blogId 
        ? updatedBlog // Use the new object returned from the server (which includes the new likes count)
        : blog // Keep the original blog object for all others
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

// Handler for the 'Remove' button click
const handleRemove = async (blog) => {
  // Use the browser's confirm dialog (modal popup) for deletion confirmation.
  const confirmed = window.confirm(`Remove blog ${blog.title} by ${blog.user.name || blog.user.username}?`)
  // On confirmation:
  if (confirmed) {
    try {
      // Call the service function to delete the blog on the backend
      await blogService.remove(blog.id)
      
      // Update the local state (blogs) to filter out the deleted blog
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
      </div>
    )
  }

  // Sort the blogs array by likes in descending order.
  // We use the spread operator (...) to create a shallow copy before sorting.
  const sortedBlogArray = [...blogs].sort((a, b) => b.likes - a.likes)
  /*
    Comparison function breakdown:
    - If b.likes > a.likes, b.likes - a.likes is positive, so 'b' comes before 'a'.
    - If a.likes > b.likes, b.likes - a.likes is negative, so 'a' comes before 'b'.
    - If likes are equal, it returns 0, and their order is unchanged relative to each other.
    This results in a descending sort (highest likes first).
  */

  // Logged-in view
  return (
    <div>
      <Notification message={notificationMessage} type={notificationType} />
      <h2>blogs</h2>
      <p>
        {user.name} logged in <button onClick={handleLogout}>logout</button>
      </p>

      {/* 4. Use the Togglable component to wrap the BlogForm */}
      {/* buttonLabel is the text for the initial 'show' button: 'create new blog' */}
      <Togglable buttonLabel="create new blog" ref={blogFormRef}>
        {/* BlogForm is passed as children. Togglable renders it when visible. */}
        {/* createBlog is the function that handles the creation logic and API call. */}
        {/* authorName is passed to keep the 'author' field fixed to the user's name. */}
        <BlogForm 
          createBlog={handleCreateNewBlog} 
          authorName={user.name} 
        />
      </Togglable>

      {/* Blog List */}
      {sortedBlogArray.map(blog =>   // Mapping over array of blogs, sorted by 'likes' descending.
        <Blog
          key={blog.id}
          blog={blog}
          handleLike={handleLike}      // Pass in 'like' handler as prop
          handleRemove={handleRemove} // Pass the 'remove' handler
          currentUser={user}         // Pass the logged-in user object for comparison and confirm ownership.
        />
      )}
    </div>
  )
}

export default App