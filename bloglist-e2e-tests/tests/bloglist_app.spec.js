//tests/bloglist_app.spec.js:
const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith, createBlog, createUser, likeBlogMultiTimes } = require('./helper')  // Import helper for reusable scripts

// Define Test User Constants
const TEST_USER = {
  name: 'Primary TestUser',
  username: 'primarytestuser',
  password: 'password1234'
}

const NON_CREATOR = {
    name: 'Secondary TestUser',
    username: 'secondarytestuser',
    password: 'password1234'
}

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('/api/testing/reset')  // API call clears the Db before each test run. Ensures test atomicity.
    // Create primary user (Creator) in the database using the createUser() helper function.
    await createUser(request, TEST_USER)
    await page.goto('http://localhost:5173')  // Navigate the browser to the application's base URL. Here, Playwright is controling real browser engin(s).
  })

  test('Login form is shown', async ({ page }) => {
    // Locate and confirm visibility of login form heading.
    const locator = page.getByText('Log in to application')
    await expect(locator).toBeVisible()
    // Use Attribute Selector to locate the Username input field.
    const usernameInput = page.locator('input[name="Username"]')
    // Confirm visibility
    await expect(usernameInput).toBeVisible()
    // Locate and confirm the visibility of the Password input field.
    const passwordInput = page.locator('input[name="Password"]')
    await expect(passwordInput).toBeVisible()
    // Use Role Locator and Accessible Name filter to locate the Login button.
    const loginButton = page.getByRole('button', { name: 'login' })
    // Confirm visibility
    await expect(loginButton).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, TEST_USER.username, TEST_USER.password)  // Use loginWith() helper function to perform login.
      await expect(page.getByText(`${TEST_USER.name} logged in`)).toBeVisible()  // Verify success message.
    })

    test('fails with wrong credentials', async ({ page }) => {
      await loginWith(page, TEST_USER.username, 'wrong-password')  // Attempt login with bad credentials.
      // Locate the error message element and store it
      const errorMessageLocator = page.getByText('invalid username or password')
      await expect(errorMessageLocator).toBeVisible()  // Confirm that error message appears.
      // Use the defined locator for CSS checks
      await expect(errorMessageLocator).toHaveCSS('border-style', 'solid')  // Verifies styling properties (solid border).
      await expect(errorMessageLocator).toHaveCSS('color', 'rgb(255, 0, 0)')  // Verifies styling properties (red text).

      await expect(page.getByText(`${TEST_USER.name} logged in`)).not.toBeVisible()  // Confirm success message NOT visible.
    })
  })

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      // Login the test user created in the outer beforeEach. To be used in subsequent (nested) tests.
      await loginWith(page, TEST_USER.username, TEST_USER.password)
    })
  
    test('a new blog can be created', async ({ page }) => {
      // Build arguments for createBlog() helper function, to create new blog.
      const blogTitle = 'Test Blog Posted From Playwright'
      const blogUrl = 'http://PlaywrightTestUser/testblog'
      const authorName = TEST_USER.name 
     
      await createBlog(page, blogTitle, blogUrl, authorName)  // Use createBlog() helper function to create and submit a new blog.
  
      // Confirm new blob title is in list of blogs. Use .blog-title-author class locator for specificity
      const newBlogLocator = page.locator(`.blog-title-author:has-text("${blogTitle}")`)
      await expect(newBlogLocator).toBeVisible()  // Verifies the new blog appears in the list
      
      // Confirm success notification
      const notificationLocator = page.getByText(`a new blog ${blogTitle} by ${authorName} added`)
      await expect(notificationLocator).toBeVisible()  // Verifies the success notification is visible
    })

    test('user can like a blog', async ({ page }) => {
      // Build arguments for createBlog() helper function, to create new blog.
      const blogTitle = 'Blog To Be Liked'
      const blogUrl = 'http://PlaywrightTestUser/liked-blog'
      const authorName = TEST_USER.name
      // Create new blog for this test, ensuring test independence (atomicity).
      await createBlog(page, blogTitle, blogUrl, authorName)

      // Identify blog item container by CSS selector (class: blog-item) filtered by blogTitle
      const blogEntry = page.locator('.blog-item', { 
          hasText: blogTitle 
      })
      // Refering to the identified blog item container, click the 'view' button to reveal details and the like button
      await blogEntry.getByRole('button', { name: 'view' }).click()
      // Confirm initial state: 'likes: 0'
      await expect(blogEntry.getByText('likes 0')).toBeVisible()
      // Click the 'like' button
      await blogEntry.getByRole('button', { name: 'like' }).click()
      // Confirm the new like count has increased to 1. Playwright waits for text to change: 'likes 0' to 'likes 1'.
      await expect(blogEntry.getByText('likes 1')).toBeVisible()
      // Click the 'like' button a second time
      await blogEntry.getByRole('button', { name: 'like' }).click()
      // Confirm likes the count incremented again. Now likes: 2.
      await expect(blogEntry.getByText('likes 2')).toBeVisible()
    })

    test('the creator can delete their own blog', async ({ page }) => {
      const blogTitle = 'Blog To Be Deleted'
      const blogUrl = 'http://PlaywrightTestUser/delete-blog.com'
      const authorName = TEST_USER.name
           
      // Create a blog to be deleted
      await createBlog(page, blogTitle, blogUrl, authorName)
      // Define the full text expected to be in the blog list
      const blogText = `${blogTitle} by ${authorName}`
      // Identify blog item container by class (.blog-item) filtered by blogTitle
      const blogEntry = page.locator('.blog-item', { 
          hasText: blogTitle 
      })
      // Click the 'view' button to reveal details and the remove button
      await blogEntry.getByRole('button', { name: 'view' }).click()
      // Set up a dialog listener BEFORE clicking 'remove'. Playwright should accept (click OK) on the confirmation dialog.
      /* NOTE:
      page.once(...)	Register an event listener active for only one occurrence of the specified event. After the event fires once, the listener is automatically removed.
      'dialog': The event being listened for. The 'dialog' event fires whenever the browser attempts to show a native modal dialog box [alert(), prompt(), confirm()] box.
      async dialog => { ... }	The handler function that executes when the dialog event fires. It is passed an object called dialog, representing the actual browser modal dialogue box.
      await dialog.accept()	accept() tells Playwright to programmatically dismiss the dialog box by simulating the user clicking the "OK" or "Confirm" button.  */
      page.once('dialog', async dialog => {
          await dialog.accept() 
      })
      // Click the 'remove' button
      await blogEntry.getByRole('button', { name: 'remove' }).click()
      // Confirm that the blog is no longer visible on the page. Use .blog-title-author for location specificity
      await expect(page.locator(`.blog-title-author:has-text("${blogTitle} by ${authorName}")`)).not.toBeVisible()
      // Identify success notification by text
      const notificationLocator = page.getByText(`Successfully removed blog: ${blogTitle}`)
      await expect(notificationLocator).toBeVisible()  // Confirm success notification.
    })

    test('delete button visibility is restricted to the creator', async ({ page, request }) => {
      // Create a secondary user (Non-Creator) in the database using the createUser() helper function.
      await createUser(request, NON_CREATOR)
      // Build arguments for createBlog() helper function, to create new blog. Blog author: TEST_USER.name.
      const blogTitle = 'Conditional Delete Test Blog'
      const blogUrl = 'http://PlaywrightTestUser/conditional-delete.com'
      const creatorName = TEST_USER.name
      // Identify [remove] button by ARIA role (button) and name: 'remove'
      const removeButtonLocator = page.getByRole('button', { name: 'remove' })
      // Identify blog item container by CSS selector (class: blog-item) filtered by blogTitle
      const blogEntryLocator = page.locator('.blog-item', { hasText: blogTitle })
      // TEST_USER create blog. TEST_USER is already logged in via the beforeEach hook.
      await createBlog(page, blogTitle, blogUrl, creatorName)
      // Within the blog item container, identify and click the [view] button.
      await blogEntryLocator.getByRole('button', { name: 'view' }).click()
      // Confirm that the [remove] button is visible to the creator.
      await expect(removeButtonLocator).toBeVisible()
      // Log out the creator
      await page.getByRole('button', { name: 'logout' }).click()
      // Login as the NON_CREATOR, using loginWith() helper function to perform login.
      await loginWith(page, NON_CREATOR.username, NON_CREATOR.password)
      // Confirm login confirmation message, i.e.: "Secondary TestUser logged in".
      await expect(page.getByText(`${NON_CREATOR.name} logged in`)).toBeVisible()
      // Identify and click [view] button again to ensure details are visible to the non-creator.
      await blogEntryLocator.getByRole('button', { name: 'view' }).click() 
      // However, confirm that the [remove] button is not visible to the non-creator.
      await expect(removeButtonLocator).not.toBeVisible()
    })

    test('blogs are ordered by likes, descending', async ({ page }) => {
      const blog1Title = 'Least Liked Blog'  // Will have 0 likes
      const blog2Title = 'Most Liked Blog'   //           5 likes
      const blog3Title = 'Mid Liked Blog'    //           3 likes
      const authorName = TEST_USER.name
      // Create all three blogs
      await createBlog(page, blog1Title, 'http://blog1.com', authorName)
      await createBlog(page, blog2Title, 'http://blog2.com', authorName)
      await createBlog(page, blog3Title, 'http://blog3.com', authorName)
      // Locate all blog entry containers and click 'view' on all of them to reveal the 'like' buttons.
      const blogEntries = await page.locator('.blog-item').all()
      // Itterate through the blog entry containers. Expand all blogs entry containers, in order to access the [like] buttons)
      for (const entry of blogEntries) {
        // Find the 'view' button within the current entry and click it
        await entry.getByRole('button', { name: 'view' }).click()
      }
      // Find the specific entries to be 'like' updated, use their class and titles as filters to locate.
      const mostLikedEntry = page.locator('.blog-item', { hasText: blog2Title })
      const midLikedEntry = page.locator('.blog-item', { hasText: blog3Title })
      // Least Liked Blog will remain at 0 likes. Action: do nothing. Zero likes in default value on creation.
      // Most Liked Blog liked 5 times, using likeBlogMultiTimes() helper method.
      await likeBlogMultiTimes(mostLikedEntry, 5)
      // Mid Liked Blog liked 3 times.
      await likeBlogMultiTimes(midLikedEntry, 3)
      // Get all blog titles by their text content, using the class 'blog-title-author' identifier.
      // This maintains the order that the elements appear on the page (top to bottom).
      const orderedTitles = await page.locator('.blog-title-author').allTextContents()

      // The expected order is: Most Liked (5) > Mid Liked (3) > Least Liked (0)
      const expectedOrder = [
        `${blog2Title} by ${authorName}`,
        `${blog3Title} by ${authorName}`,
        `${blog1Title} by ${authorName}`
      ]
      // Confirm that the rendered order of titles is same as expected order.
      await expect(orderedTitles).toEqual(expectedOrder)
    })
  })
})