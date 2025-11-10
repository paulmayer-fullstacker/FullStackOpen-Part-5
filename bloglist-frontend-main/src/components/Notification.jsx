// src/components/Notification.jsx
const Notification = ({ message, type }) => {
  if (message === null) {
    return null
  }

  // Use the type prop to determine the CSS class
  const className = `notification ${type}`
  // When type is 'success', the resulting class is "notification success".
  // When type is 'failure', the class is "notification failure"
  return (
    <div className={className}>
      {message}
    </div>
  )
}

export default Notification