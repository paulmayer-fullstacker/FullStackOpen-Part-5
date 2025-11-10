// eslint.config.mjs:
// Import required configuration objects and plugins
import globals from 'globals'  // Import a library containing definitions of global variables for various environments (like 'node', 'browser', etc.)
import js from '@eslint/js'  // Import basic configurations from ESLint.
import stylisticJs from '@stylistic/eslint-plugin-js'  // Import the plugin for JavaScript-specific stylistic rules.
// Export the main configuration array (flat config format)
export default [
  // First item in the array applies a base configuration.
  js.configs.recommended,  // Apply ESLint's core set of recommended rules (for best practices and potential problems).
  // Second item is a configuration object for specific file types and settings
  {
    files: ['**/*.js'],  // Specify that this configuration object only applies to files ending with '.js'
    languageOptions: {  // Configuration for JavaScript language options:
      sourceType: 'commonjs',  // Specify the type of JavaScript source code (e.g., 'commonjs' for Node.js style)
      globals: { ...globals.node },  // Define the global variables available, spreading in all Node.js global variables (like 'process', 'require', etc.)
      ecmaVersion: 'latest',  // Set the c (e.g., ES2024 15th Edition)
    },
    plugins: {  // Define plugins used in this configuration.
      '@stylistic/js': stylisticJs,  // Register the imported stylistic plugin under the alias '@stylistic/js'.
    },
    rules: {   // Defines custom / override rules to be enforced:
      '@stylistic/js/indent': ['error', 2],  // 2-space indentation, treating any violation as an 'error'.
      '@stylistic/js/linebreak-style': ['error', 'unix'],  // Unix-style line endings ('\n'), treating any violation as an 'error. VSCode: LF rather than CRLF
      '@stylistic/js/quotes': ['error', 'single'],  // Use of single quotes for strings, treating any violation as an 'error'.
      '@stylistic/js/semi': ['error', 'never'],  // Disallow semicolons at the end of statements, any violation as an 'error'.
      eqeqeq: 'error',   // Require the use of '===' and '!==' (strict equlaity) instead of '==' and '!=' (loose equlaity).
      'no-trailing-spaces': 'error',  // Disallow unnecessary white space (spaces at the end of lines).
      'object-curly-spacing': ['error', 'always'],  // Require spaces inside object curly braces (e.g., `{ a: 1 }` not `{a: 1}`).
      'arrow-spacing': ['error', { before: true, after: true }],  // Require a space before and after the arrow in arrow functions (e.g., `() => {}`).
      'no-console': 'off',  // Turn off the rule that disallows 'console.log', allowing its use.
    },
  },
  // Third item: A configuration object for ignoring files.
  {
    ignores: ['dist/**'],  // Specify patterns for files and directories that ESLint should ignore (here, ignoring everything in the 'dist' folder).
  },
]
