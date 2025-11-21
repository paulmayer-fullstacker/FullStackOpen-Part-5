// components/Togglable.jsx:
// Togglable is a reusable wrapper that lets us show or hide content with a button click.
import { useState, useImperativeHandle, forwardRef } from 'react' // Also import forwardRef

// Wrap the function in forwardRef and add 'ref' argument
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

  // useImperativeHandle now attaches the object to the 'ref' passed from the parent.
  useImperativeHandle(ref, () => {
    return { toggleVisibility }
  })

  return (
    <div>
      {/* This section is shown ONLY when the content is hidden */}
      <div style={hideWhenVisible}>           {/* Style makes this visible when `visible` is false */}
        <button onClick={toggleVisibility}>  {/* Clicking shows the hidden content */}
          {props.buttonLabel}</button>      {/* Text for the button comes from parent component */}
      </div>
      {/* This section is shown ONLY when the content is visible */}
      <div style={showWhenVisible}>            {/* Style makes this visible when `visible` is true */}
        {props.children}                      {/* Render whatever elements the parent passes inside <Togglable> */}
        <button onClick={toggleVisibility}>  {/* Clicking hides the content again */}
          cancel</button>
      </div>
    </div>
  )
}) // Close forwardRef wrapper

// Add display name
Togglable.displayName = 'Togglable'

export default Togglable