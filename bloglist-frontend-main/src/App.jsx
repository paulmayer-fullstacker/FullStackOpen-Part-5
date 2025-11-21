// App.jsx:
import { useState, useEffect, useRef } from 'react'   // Import React hooks: state, side effects, and references.
import Blog from './components/Blog'                  // Import the Blog component for displaying individual blogs.
import blogService from './services/blogs'            // Import blog service module for API calls.
import loginService from './services/login'           // Import login service module for user authentication.
import Notification from './components/Notification'  // Import Notification component for displaying messages.
import Togglable from './components/Togglable'        // Import Togglable component to hide/show content (like the blog form).
import BlogForm from './components/BlogForm'          // Import BlogForm component for creating new blogs

const App = () => {
  const [blogs, setBlogs] = useState([])              // State to store the array of blog objects.

  const [username, setUsername] = useState('')        // State to store the login form's username input.
  const [password, setPassword] = useState('')        // State to store the login form's password input.
  const [user, setUser] = useState(null)              // State to store the logged-in user object (null, if logged out).

  // Notification messages:
  const [notificationMessage, setNotificationMessage] = useState(null)   // State to store the notification text (default: null).
  const [notificationType, setNotificationType] = useState(null)         // State for the notification type ('success' or 'failure').

  // Create a ref for the Togglable component
  const blogFormRef = useRef()                         // Create a ref to interact with the Togglable component's functions (e.g., toggleVisibility).

  // Helper function to display a temporary notification.
  const showNotification = (message, type) => {
    setNotificationMessage(message)                    // Set message content.
    setNotificationType(type)                          // Set the message type (for styling).
    setTimeout(() => {                                 // Set a timeout to clear the notification.
      setNotificationMessage(null)                     // Clear the message to 'null' ...*.
      setNotificationType(null)                        // Clear the type to 'null' ...*.
    }, 10000)                                          // ... after 10 seconds.
  }

  // Helper function to fetch blogs
  const fetchBlogs = async () => {                     // Define an async function to fetch all blogs.
    try {
      const initialBlogs = await blogService.getAll()  // Fetch all blogs from the service.
      setBlogs(initialBlogs)                           // Update the blogs state.
    } catch (error) {
      console.error('Failed to fetch blogs:', error)   // Log an error if fetch fails.
    }
  }

  // useEffect for session restoration (runs once on load)
  useEffect(() => {                                                           // Effect hook runs once after the initial render (empty dependency array).
    const loggedUserJSON = window.localStorage.getItem('loggedBloglistUser')  // Check local storage for a previously logged-in user.
    if (loggedUserJSON) {                                                     // If user data is found in local storage:
      const user = JSON.parse(loggedUserJSON)                                 // Parse the JSON string back into an object.
      if (user && user.token) {           // Defensive check for token existence on refresh. If the user object and token are valid:
        setUser(user)                     // Set the user state.
        blogService.setToken(user.token)  // Set the JWT token in the blog service for authenticated requests.
        fetchBlogs()                      // Fetch blogs now that the token is set (to enable like/delete).
      } else {                            // else: Clear broken token and fetch blogs anonymously if token is missing
        window.localStorage.removeItem('loggedBloglistUser')  // Remove the corrupted local storage item.
        fetchBlogs()                      // Fetch blogs anonymously.
      }
    } else {                              // else if no user is logged in, still fetch blogs (anonymous view)
      fetchBlogs()
    }
  }, [])                                 // Effect hook runs once after the initial render (empty dependency array).


  // Login handler
  const handleLogin = async event => {   // Handler for the login form submission.
    event.preventDefault()               // Prevent the default form submission behavior (page reload).
    try {
      const user = await loginService.login({ username, password }) // Call the login service with current inputs.

      // Defensive check: Ensure user object and token exist before setting state/storage
      if (!user || !user.token) {           // Check for a valid response structure.
        throw new Error('Login response missing user data or token.')   // Throw error if data is malformed.
      }

      window.localStorage.setItem(                      // Store the user object (inc. JWT token) in local storage.
        'loggedBloglistUser', JSON.stringify(user)
      )
      blogService.setToken(user.token)                  // Set the token in the blog service.
      setUser(user)                                     // Set the user state, triggering a re-render to the logged-in view.
      setUsername('')                                   // Clear the username and password in the input fields.
      setPassword('')
      showNotification(`Welcome, ${user.name}!`, 'success')   // Show a success notification

      fetchBlogs()     // Re-fetch blogs to update the view, ensuring up-to-date data.

    } catch (exception) {
      const errorMessage = exception.response    // Try to access the server's error response.
        ? exception.response.data.error || 'wrong username or password'
        : 'wrong username or password'           // Extract the server's error message if available, otherwise use a generic message.

      showNotification(                          // Show an error notification.
        errorMessage,
        'failure'
      )
      console.error('Login Error:', exception)  // Log the error.
    }
  }

  // Logout handler
  const handleLogout = () => {                            // Handler for the logout button click.
    window.localStorage.removeItem('loggedBloglistUser')  // Remove user data from local storage.
    blogService.setToken(null)                            // Clear the token in the blog service.
    setUser(null)                                         // Clear the user state, triggering a re-render to the login view.
    setBlogs([])                                          // Clear list to force a clean slate until next fetch
    fetchBlogs()                                          // Re-fetch as anonymous user, to populate the list again.
  }

  // Blog creation handler
  const handleCreateNewBlog = async (blogObject) => {
    try {
      // Send the new blog object to the backend
      const returnedBlog = await blogService.create(blogObject)   // Call the blogService to create the blog.
      // Update local blogs state with the new blog (relying on backend populating user)
      setBlogs(blogs.concat(returnedBlog))    // Add the new blog to the local state array.
      blogFormRef.current.toggleVisibility()  // Use the ref to hide the Togglable component.
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

  // Handler for the 'Like' button click
  const handleLike = async (blogId) => {                    // Handler for liking a blog.
    try {
      const updatedBlog = await blogService.like(blogId)   // Call the service to send a like request.
      setBlogs(blogs.map(blog =>                           // Update the local state immutably.
        blog.id === blogId
          ? updatedBlog                                    // Replace the old blog object with the updated one.
          : blog                                           // or keep blog unchanged.
      ))
      showNotification(                                    // Success message with new count.
        `Liked blog: ${updatedBlog.title}. New likes: ${updatedBlog.likes}`,
        'success'
      )
    } catch (exception) {                                  // Error message.
      showNotification('Failed to like the blog.', 'failure')
      console.error('Failed to like blog:', exception)
    }
  }

  // Handler for the 'Remove' button click
  const handleRemove = async (blog) => {
    // Use optional chaining for safe access to user properties in confirmation message
    const ownerName = blog.user?.name || blog.user?.username || 'Unknown Author'   // Safely get the author's name.
    const confirmed = window.confirm(`Remove blog ${blog.title} by ${ownerName}?`) // Prompt the user for confirmation.
    if (confirmed) {                                        // On confirmation:
      try {
        await blogService.remove(blog.id)                   // Send the delete request to the backend.
        setBlogs(blogs.filter(b => b.id !== blog.id))       // Filter out the deleted blog from the local state.

        showNotification(
          `Successfully removed blog: ${blog.title}`,
          'success'
        )
      } catch (exception) {
        showNotification('Failed to delete the blog. Only the creator can delete a blog.', 'failure')   // Authentication error.
        console.error('Failed to delete blog:', exception)
      }
    }
  }

  const sortedBlogArray = [...blogs].sort((a, b) => (b.likes || 0) - (a.likes || 0))  // Create a sorted copy of blogs (descending).


  // Conditional Rendering for Login Form
  if (user === null) {                   // If no user is logged in, show the login form and blogs for anonymous viewing.
    return (
      <div>
        {/* // Display notifications. */}
        <Notification message={notificationMessage} type={notificationType} />
        <h2>Log in to application</h2>

        <form onSubmit={handleLogin}>
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

        {/* Title for the blog list, only if blogs exist. */}
        {sortedBlogArray.length > 0 && <h3>Available Blogs</h3>}
        {/* // Map over the sorted blogs. */}
        {sortedBlogArray.map(blog =>
          <Blog
            key={blog.id}
            blog={blog}
            // // Render Blog component without interactive handlers. Do NOT pass handleLike/handleRemove when user is null (anonymous)
          />
        )}
      </div>
    )
  }
  // Logged-in view
  return (
    // If a user is logged in.
    <div>
      {/* Display notifications. */}
      <Notification message={notificationMessage} type={notificationType} />
      <h2>blogs</h2>
      <p>
        {/* Display user name and a logout button. */}
        {user.name} logged in <button onClick={handleLogout}>logout</button>
      </p>
      {/* Togglable component to hide the blog creation form. */}
      <Togglable buttonLabel="create new blog" ref={blogFormRef}>
        <BlogForm
          createBlog={handleCreateNewBlog}   // Pass the creation handler to the form.
          authorName={user.name}             // Pass the current user's name (optional context).
        />
      </Togglable>

      {/* Blog List: This uses sortedBlogArray by default now */}
      {sortedBlogArray.map(blog =>
        <Blog
          key={blog.id}
          blog={blog}
          // Pass handlers ONLY when user is logged in
          handleLike={handleLike}
          handleRemove={handleRemove}
          currentUser={user}   // Pass the current user object for conditional rendering (e.g., remove button).
        />
      )}
    </div>
  )
}
export default App