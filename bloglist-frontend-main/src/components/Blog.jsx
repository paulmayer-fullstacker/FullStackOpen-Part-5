// components/Blog.jsx:
import { useState } from 'react'
// Destructure the props
const Blog = ({ blog, handleLike, handleRemove, currentUser }) => {
  // State to control visibility of details
  const [visible, setVisible] = useState(false)

  // Function to toggle visibility state (show/hide details).
  const toggleVisibility = () => {
    setVisible(!visible)
  }
  // Calls the prop handleLike function with the blog's ID
  // NOTE: This function will only be called if handleLike exists (see fullView below)
  const likeBlog = () => {
    handleLike(blog.id)
  }
  // Function to call the parent's remove handler with the blog object.
  const removeBlog = () => {
    handleRemove(blog)
  }
  // Author Name: Prefer the full name if available, otherwise use the username.
  const authorName = blog.user?.name || blog.user?.username || 'Unknown Author'
  // Check if the current user is the creator of the blog. This requires both user and currentUser to exist.
  const isCreator = blog.user && currentUser
    && (blog.user.id?.toString() === currentUser.id.toString())
  // Encapsulated Styling. Basic inline styling for the blog container.
  const blogStyle = {
    paddingTop: 10,
    paddingLeft: 2,
    border: 'solid',
    borderWidth: 1,
    marginBottom: 5
  }

  // Content shown by default (Title and Author)
  const defaultView = (
    // class added for test identification
    <div className='default-view'>
      {/* Span with class added to target element for test. Test: bloglist_app.spec.js: test('blogs are ordered by likes, descending').*/}
      <span className='blog-title-author'>
        {/* Class blog-title-author allows Playwright to scan the page and retrieve the full text of all visible blogs, in the order they appear, to confirm sorting is correct. */}
        {blog.title} by {authorName}
      </span>
      <button onClick={toggleVisibility}>view</button>
    </div>
  )

  // Content shown when visible (URL, Likes, User)
  const fullView = (
    // class added for test identification
    <div className='full-view'>
      {/* Top line with title, author, and the 'hide' button */}
      <div>
        {/* Span with class added to target element for test. Test: bloglist_app.spec.js: test('blogs are ordered by likes, descending').*/}
        <span className='blog-title-author'>
          {blog.title} by {authorName}
        </span>
        <button onClick={toggleVisibility}>hide</button>
      </div>

      {/* Blog Details */}
      <div className='blog-url'>{blog.url}</div>
      <div className='blog-likes'>likes {blog.likes}
        {/* Only render the 'like' button if the handleLike prop is provided (i.e., user is logged in) */}
        {handleLike && <button onClick={likeBlog}>like</button>}
      </div>
      {/* The author's name is displayed */}
      <div>{authorName}</div>

      {/* Remove button, only shown if the current user created subject blog and handleRemove is provided */}
      {isCreator && handleRemove && (
        <button onClick={removeBlog}>remove</button>
      )}
    </div>
  )

  // Conditional Rendering
  return (
    <div style={blogStyle} className='blog-item'>
      {visible ? fullView : defaultView}  {/* Shows fullView if 'visible' is true, otherwise shows defaultView. */}
    </div>
  )
}

export default Blog