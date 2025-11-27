// components/BlogForm.jsx
import { useState } from 'react'

const BlogForm = ({ createBlog, authorName }) => {
  // Local state for form inputs
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')

  // The author is passed as a prop and should not be changed by the user
  const newAuthor = authorName

  const addBlog = (event) => {
    event.preventDefault()

    // Call the parent handler with the new blog object
    createBlog({
      title: newTitle,
      author: newAuthor,
      url: newUrl,
    })

    // Clear the form fields after submission
    setNewTitle('')
    setNewUrl('')
    // Note: newAuthor remains fixed via the prop
  }

  return (
    <div>
      <h3>create new</h3>
      {/* Form element; when submitted, calls the addBlog function */}
      <form onSubmit={addBlog}>
        <div>
          <label htmlFor="title-input">title:</label>
          <input  // Use labels to enhance accessability, and assist auto testing (screen.getByLabelText).
            id="title-input"
            value={newTitle}  // The current title value stored in component state
            onChange={({ target }) => setNewTitle(target.value)}  // When the user types in the input, update the newTitle state with the new value.
            name="Title"
          />
        </div>
        {/* Author input field (read-only, filled from the logged-in user's data) */}
        <div>
          <label htmlFor="author-input">author:</label>
          <input
            id="author-input"
            value={newAuthor}    // Shows the author's name (logged-in user's name) from state
            readOnly // Author field is read-only
          />
        </div>
        {/* URL input field */}
        <div>
          <label htmlFor="url-input">url:</label>
          <input
            id="url-input"
            value={newUrl}     // Current URL stored in state
            onChange={({ target }) => setNewUrl(target.value)}   // When typing, update newUrl state
            name="URL"
          />
        </div>
        {/* The 'create' button triggers the submission */}
        <button type="submit">create</button>   {/* Triggers form submission → calls addBlog */}
      </form>
    </div>
  )
}

export default BlogForm