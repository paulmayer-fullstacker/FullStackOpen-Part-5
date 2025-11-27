// testSetup.js:
// After each test, the cleanup function is executed to reset jsdom (which is simulating the browser).
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
})