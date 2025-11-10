// tests/list_helper.test.js:

const { test, describe } = require('node:test')  // Import test functions (test and describe) from Node's built-in testing module.
const assert = require('node:assert')  // Imports Node's built-in assertion module.
const listHelper = require('../utils/list_helper')  // Import the utility function file (containing: dummy, totalLikes, favouriteBlog, mostBlogs, mostLikes)

// Import all necessary test data from tests/test_data.js
const {
  listWithOneBlog,
  listOfBlogs,
  emptyList
} = require('./test_data')

// dummy test
describe('dummy', () => {
  // Test 1: For the simplest case, ensure the function works.
  test('dummy returns one', () => {
    // Uses the imported emptyList
    const result = listHelper.dummy(emptyList)  // Calls the function being tested.
    assert.strictEqual(result, 1)  // Asserts that the result is strictly equal to 1. List_helper.js dummy is hardcoded to return '1'.
  })
})

// total likes tests
describe('total likes', () => {

  // The sum of an empty list of blogs must be zero.
  test('of empty list is zero', () => {
    const result = listHelper.totalLikes(emptyList)
    assert.strictEqual(result, 0)  // Assert return 0 likes from an empty list
  })

  // The sum of a list with only one blog equals that blog's likes.
  test('when list has only one blog, equals the likes of that', () => {
    const result = listHelper.totalLikes(listWithOneBlog)
    assert.strictEqual(result, 5)   // The single blog from listWithOneBlog has 5 likes. So assert 5 likes returned
  })

  // The sum of the full list of blogs is calculated correctly.
  test('of a full list is calculated correctly', () => {
    const result = listHelper.totalLikes(listOfBlogs)
    const expectedTotalLikes = 36  // Sum of likes in listOfBlogs: 7 + 5 + 12 + 10 + 0 + 2 = 36
    assert.strictEqual(result, expectedTotalLikes)  // Expects 36 likes for the full list.
  })
})
// favourite blog tests
describe('favourite blog', () => {  // Start a test suite for the 'favouriteBlog' function
  // The expected result for the single blog list.
  const expectedOneBlog = {
    _id: '5a422aa71b54a676234d17f8',
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf',
    likes: 5,
    __v: 0
  }
  // The expected result for the full list (likes: 7, 5, 12, 10, 0, 2). Favourite has 12 likes.
  const expectedFavourite = {
    _id: '5a422b3a1b54a676234d17f9',
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12, // <-- This is the highest like count
    __v: 0
  }
  // Tests:
  // Empty List
  test('of empty list is null', () => {
    const result = listHelper.favouriteBlog(emptyList)
    assert.strictEqual(result, null)  // Assert null returned from empty list
  })

  // List with one blog
  test('when list has only one blog, returns that blog', () => {
    const result = listHelper.favouriteBlog(listWithOneBlog)
    // Use deepStrictEqual to ensure the returned object is identical. Compares returned object's structure and values.
    assert.deepStrictEqual(result, expectedOneBlog)
  })

  // Full list
  test('of a full list is correctly identified', () => {
    const result = listHelper.favouriteBlog(listOfBlogs)
    // Use deepStrictEqual to ensure the returned object is the correct favorite. Compares returned object's structure and values.
    assert.deepStrictEqual(result, expectedFavourite)
  })
})

describe('mostBlogs', () => {  // Start a test suite for the 'mostBlogs' function.

  test('of a full list, returns the author with the largest amount of blogs', () => {
    const expected = {
      author: 'Robert C. Martin',  // This author has 3 blogs in listOfBlogs
      blogs: 3
    }
    const result = listHelper.mostBlogs(listOfBlogs)  // Accessing the function via the imported list_helper object
    assert.deepStrictEqual(result, expected)  // Compare returned object's structure and values.
  })
})

describe('mostLikes', () => {  // Start a test suite for the 'mostLikes' function.
  const expectedTopAuthor = {
    author: 'Edsger W. Dijkstra',  // Edsger W. Dijkstra has: 5 + 12 = 17 likes. - Top Author
    likes: 17
  }
  test('of a full list, returns the author with the largest total likes', () => {
    const result = listHelper.mostLikes(listOfBlogs)
    assert.deepStrictEqual(result, expectedTopAuthor)  // Compares the returned object's structure and values.
  })
})
// The 'after' hook, closing the Mongoose connection, is placed at the end of the bloglist_api.test.js.