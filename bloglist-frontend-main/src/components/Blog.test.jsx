// src/components/Blog.test.jsx:

import { render, screen } from '@testing-library/react'  // Import 'render', to mount the React component. Import 'screen', to query the resulting DOM.
import userEvent from '@testing-library/user-event'   // Import userEvent to simulate user interaction (i.e., button clicks).
import Blog from './Blog' // Import Blog component, for blog test cases.
import BlogForm from './BlogForm' // Import the BlogForm component, for blog form test cases.
// Shared mock data used across multiple tests to represent a blog object from the API.
const testBlog = {
  title: 'Testing Blog Component',
  url: 'http://testurl.com',
  likes: 10,
  user: { name: 'Test User' }, // Mock user data to ensure authorName resolves correctly
  id: 'someId123'
}

// vi.fn() (Vitest/Jest)	Creates a mock function (a spy) that records when it is called and with what arguments.
const testHandler = vi.fn()  // Define a mock handler for the 'like' function.

// Define a test case with a descriptive name. The test checks the component's default (collapsed) state.
test('Blog component renders title and author, but not URL or likes in default view', () => {
  // Use the shared testBlog object
  const blog = testBlog

  render(<Blog blog={blog} />)  // Renders the 'Blog' component, passing the mock 'blog' object as a prop.
  // This mounts the component into the JSDOM environment, simulating a browser. See vite.config.js:test:environment:'jsdom'.

  // Create title and author string.
  // String Interpolation ($\{...\}$): Expressions {inside the curly braces} evaluated and converted into their string representation.
  // Template Literal (`...`): Embeds expressions (`variables, object properties, function calls`) directly inside a string.
  // Concatenation (=): The resulting string values are then combined with the space character between them. Result: singal string value.
  const titleAndAuthorText = `${blog.title} ${blog.user.name}`

  // Use screen.getByText to check if the main text content (titleAndAuthorText) is present.
  // `getByText` throws an error if element not found. exact: false, matching is case-insensitive.
  const defaultViewElement = screen.getByText(titleAndAuthorText, { exact: false }) // exact: false, also handles potential white-space/ordering issues.
  expect(defaultViewElement).toBeDefined()  // Expect element to be successfully found (i.e., it is defined).
  expect(defaultViewElement).toBeVisible()  // Expect element containing title/author is visible to the user.
  // Use queryByText to check that URL is NOT visible by default.
  const urlElement = screen.queryByText(blog.url) //  if blog.url exists, urlElement=reference to URL, else urlElement=null
  expect(urlElement).toBeNull() // Expect urlElement to equal null.

  // Check that likes are NOT visible by default
  const likesText = `likes ${blog.likes}`
  // screen (from the React Testing Library)	Represents the virtual DOM and is used to query (find) elements.
  const likesElement = screen.queryByText(likesText)
  // fullView is not rendered, so the text should not be visible in the DOM.
  expect(likesElement).toBeNull()
})
// Test case: Checks the component's URL and Likes are displayed when the 'View' button is clicked (expanded state).
// Simulates a click on the "view" button, which triggers the toggleVisibility function inside Blog.jsx,
// causing a state change and re-render to display the fullView content. The test then queries the new DOM state.
test('Blog URL and likes are shown after clicking the view button', async () => {
  // Create 'user' object for simulation.
  const user = userEvent.setup()

  // Render the component with the test data and the test handler (simulates logged-in user)
  render(
    <Blog
      blog={testBlog}
      handleLike={testHandler}
    />
  )

  // Find the 'view' button in the initial DOM state.
  const viewButton = screen.getByText('view')

  // Simulate a user click on the 'view' button, which triggers a state update in Blog.jsx.
  await user.click(viewButton)
  // After the click, the state is toggled to visible (true).

  // Check for the visibility of the URL. The URL text is 'http://testurl.com'
  const urlElement = screen.getByText(testBlog.url, { exact: false })
  expect(urlElement).toBeVisible() // Assert the URL is present and visible.

  // Check for the visibility of the likes. The lik
  const likesText = `likes ${testBlog.likes}`  // Construct the likes count text.
  const likesElement = screen.getByText(likesText, { exact: false })  // Query the DOM for the likes count text.
  expect(likesElement).toBeVisible() // Expect the likes count to be present and visible.
})

// Test case: Confirm that the Like Button Handler is called twice if the [Like] button is clicked twice.
// Simulates two clicks on the "like" button, which triggers the likeBlog function inside Blog.jsx.
// That function, in turn, calls the prop handleLike, which is the mock function (testLikeHandler). Verifies that the mock function was called twice.
test('Event handler is called twice if the like button is clicked twice', async () => {
  const user = userEvent.setup()

  // Create a dedicated mock function to track calls for this test
  const testLikeHandler = vi.fn()

  // Render the component, passing the dedicated mock function as the handler.
  render(
    <Blog
      blog={testBlog}
      handleLike={testLikeHandler} // Pass the mock function
    />
  )

  // Reveal the 'like' button by clicking 'view'
  const viewButton = screen.getByText('view')
  await user.click(viewButton)

  // Find the 'like' button, which should now be visible.
  const likeButton = screen.getByText('like')

  // Simulate two clicks on the 'like' button
  await user.click(likeButton)
  await user.click(likeButton)

  // Assertion: Expect the mock handler to have been called exactly two times
  expect(testLikeHandler.mock.calls).toHaveLength(2)
})

// Test Form Submission: Simulates typing into the inputs, which triggers the onChange handlers inside BlogForm.jsx to update its local state (newTitle, newUrl).
// Simulating the click on the "create" button triggers the addBlog function, which calls the prop createBlog. This prop is the mock function (testCreateHandler),
// and the test verifies that it was called with the final state of the form inputs (title, author, url).
test('BlogForm calls the createBlog handler with the right details after submission', async () => {
  // userEvent (RTL).	Simulates real user interactions (typing, clicking), which trigger event handlers.
  const user = userEvent.setup()

  // Create a mock function to track the object passed to the form's submit handler.
  const testCreateHandler = vi.fn()
  // Define test data for the form.
  const testAuthorName = 'Logged In User'
  const testTitle = 'Testing Form Submission'
  const testUrl = 'http://example.com/formtest'

  // Render BlogForm component, passing the mock handler and author prop.
  render(<BlogForm createBlog={testCreateHandler} authorName={testAuthorName} />)

  // Find inputs by their label text (case-insensitive). Component uses <label> and 'id' for this reason.
  const titleInput = screen.getByLabelText(/title/i)
  const urlInput = screen.getByLabelText(/url/i)
  // Find the submission button
  const createButton = screen.getByText('create')

  await user.type(titleInput, testTitle)  // Simulate user input, typing the title into the title input.
  await user.type(urlInput, testUrl)  // Simulate typing the URL into the URL input.

  // Simulate form submission. Clicking the 'create' button, which triggers the form's onSubmit handler.
  await user.click(createButton)

  // Assertion: Check that the handler was called once
  expect(testCreateHandler.mock.calls).toHaveLength(1)

  // Check that the handler was called with the correct object.
  // Retrieve the object passed as the first argument in the first call to the mock function.
  const submittedBlogData = testCreateHandler.mock.calls[0][0]
  // Assertion: Expect the submitted object to match the data that was input.
  expect(submittedBlogData).toEqual({
    title: testTitle,
    author: testAuthorName,
    url: testUrl,
  })
})