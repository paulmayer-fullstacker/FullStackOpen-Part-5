// tests/helper.js:
const loginWith = async (page, username, password)  => {
  // Use Attribute Selectors that match our HTML 'name' attributes
  await page.locator('input[name="Username"]').fill(username)
  await page.locator('input[name="Password"]').fill(password)
  await page.getByRole('button', { name: 'login' }).click() // Clicks the login button.
}

const createBlog = async (page, title, url, author) => {
  // Click the Togglable button to open the form
  await page.getByRole('button', { name: 'create new blog' }).click()
  // Fill the title field, located by its name attribute
  await page.locator('input[name="Title"]').fill(title)
  // Fill the url field, located by its name attribute
  await page.locator('input[name="URL"]').fill(url) 
  // Click the 'create' button inside the form
  await page.getByRole('button', { name: 'create' }).click()
  // Wait for the Success Notification.
  const notificationText = `a new blog ${title} by ${author} added`
  await page.getByText(notificationText).waitFor()
}
// Create new user document in the Db by making an HTTP POST request to the backend's user registration API endpoint.
const createUser = async (request, user) => {
  await request.post('/api/users', {  // '/api/users': The backend API endpoint for creating new users (registration). See backend/controllers/users
    data: {  // Specify the request body data sent with the POST request.
      name: user.name,
      username: user.username,
      password: user.password
    }
  })
} // The function returns implicitly once the request is complete (resolved or rejected).

const likeBlogMultiTimes = async (blogEntry, n) => {
  // blogEntry is a Playwright Locator object passed from the test file.
  const likeButton = blogEntry.getByRole('button', { name: 'like' })
  for (let i = 0; i < n; i++) {
    // Playwright automatically waits for the element to be ready before clicking.
    await likeButton.click()
  }
}

// Export all helper functions
export { loginWith, createBlog, createUser, likeBlogMultiTimes }