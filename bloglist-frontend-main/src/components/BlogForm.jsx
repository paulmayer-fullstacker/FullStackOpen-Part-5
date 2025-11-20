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
      <form onSubmit={addBlog}>
        <div>
          title:
          <input
            value={newTitle}
            onChange={({ target }) => setNewTitle(target.value)}
            name="Title"
          />
        </div>
        <div>
          author:
          <input
            value={newAuthor} 
            readOnly // Author is read-only, set to the logged-in user's name
          />
        </div>
        <div>
          url:
          <input
            value={newUrl}
            onChange={({ target }) => setNewUrl(target.value)}
            name="URL"
          />
        </div>
        {/* The 'create' button triggers the submission */}
        <button type="submit">create</button>
      </form>
    </div>
  )
}

export default BlogForm