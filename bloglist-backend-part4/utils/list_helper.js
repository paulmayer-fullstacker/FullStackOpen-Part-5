// utils/list_helper.js:
// Import the Lodash library and alias it to '_'.
const _ = require('lodash')

const dummy = (blogs) => {
  // Explicit return statement.
  console.log(blogs)
  return 1
}

const totalLikes = (blogs) => {
  // Use reduce() method to sum the 'likes' property from each blog object. Initial value for the accumulator (sum) is set to 0.
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favouriteBlog = (blogs) => {
  // Handle the edge case: empty list.
  if (blogs.length === 0) {
    return null
  }
  // Use reduce to find the blog with the most likes.
  // 'favorite' is the accumulator (the currently best blog found). 'currentBlog' is the current element being processed.
  return blogs.reduce((favourite, currentBlog) => {
    // Check if the current blog has more likes than the current favorite.
    return currentBlog.likes > favourite.likes
      ? currentBlog // If yes, the current blog becomes the new favorite.
      : favourite    // Otherwise, keep the existing favorite.
  })
}

// Lodash interpretation of mostBlogs
const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return null
  }

  // Use _.countBy to create an object where: keys = authors and values = their blog counts. Example: { 'Robert C. Martin': 3, 'Edsger W. Dijkstra': 2, ... }
  const blogCounts = _.countBy(blogs, 'author')

  // Use _.map to convert the author/count object into an array of objects, in the required format: [{ author: 'Robert C. Martin', blogs: 3 }, ...]
  const authorBlogPairs = _.map(blogCounts, (blogs, author) => ({
    author: author,
    blogs: blogs
  }))

  // Use _.maxBy to find the single object in the array that has the largest 'blogs' value.
  const topAuthor = _.maxBy(authorBlogPairs, 'blogs')

  return topAuthor
}

// Lodash interpretation of mostLikes
const mostLikes = (blogs) => {
  if (blogs.length === 0) {
    return null
  }

  // Use _.groupBy to group the blogs by author. Example: { 'Edsger W. Dijkstra': [ {blog1}, {blog2} ], ... }
  const groupedByAuthor = _.groupBy(blogs, 'author')

  // Use _.map to transform the grouped object into an array of author/likes objects.
  const authorLikesObjs = _.map(groupedByAuthor, (authorBlogs, author) => ({
    author: author,
    // For each author, use _.sumBy to total the 'likes' of their blogs. Example: [{ author: 'Edsger W. Dijkstra', likes: 17 }, ...]
    likes: _.sumBy(authorBlogs, 'likes')
  }))

  // Use _.maxBy to find the single object in the array that has the largest 'likes' value.
  const topAuthor = _.maxBy(authorLikesObjs, 'likes')

  return topAuthor
}

module.exports = {
  dummy,
  totalLikes,
  favouriteBlog,
  mostBlogs,
  mostLikes
}