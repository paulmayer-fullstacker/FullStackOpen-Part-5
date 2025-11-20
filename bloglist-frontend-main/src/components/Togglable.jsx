// components/Togglable.jsx:
// Togglable is a reusable wrapper that lets you show or hide content with a button click.
import { useState, useImperativeHandle, forwardRef } from 'react' // <--- 1. IMPORT forwardRef

// --- 2. WRAP THE FUNCTION WITH forwardRef AND ADD 'ref' ARGUMENT ---
const Togglable = forwardRef((props, ref) => { // 'ref' is now available here

  const [visible, setVisible] = useState(false)  // useState(false): by default content is hidden

  // These two lines are creating JavaScript objects that define inline CSS styles based on the current value of the visible state variable.
  // hideWhenVisible controls the “Show” button (visible only when the content is hidden, and hidden when the content is visible
  const hideWhenVisible = { display: visible ? 'none' : '' }
  const showWhenVisible = { display: visible ? '' : 'none' }
  // showWhenVisible controls the content + “Cancel” button (visible only when the content is visible).
  // Define a function to flip the visible state between true/false.
  const toggleVisibility = () => {
    setVisible(!visible)
  }

  // --- 3. USE 'ref' ARGUMENT HERE ---
  // useImperativeHandle now attaches the object to the 'ref' passed from the parent.
  useImperativeHandle(ref, () => {
    return { toggleVisibility }
  })

  return (
    <div>
      <div style={hideWhenVisible}>
        <button onClick={toggleVisibility}>{props.buttonLabel}</button>
      </div>
      <div style={showWhenVisible}>
        {props.children}
        <button onClick={toggleVisibility}>cancel</button>
      </div>
    </div>
  )
}) // <--- 4. CLOSE forwardRef WRAPPER

// 5. Add display name (good practice)
Togglable.displayName = 'Togglable'

export default Togglable