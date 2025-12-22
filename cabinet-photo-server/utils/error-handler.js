/**
 * Error Handler Utility
 *
 * Provides generic error handling that hides implementation details in production
 * while showing detailed error information in development environments.
 */

/**
 * Generic error handler that hides implementation details in production
 * @param {Error} error - The error object
 * @param {string} userMessage - Generic message to show to user
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 500)
 */
function handleError(error, userMessage, res, statusCode = 500) {
  // Always log the full error for debugging
  console.error(`[ERROR] ${userMessage}:`, error);

  // In production, send generic message only
  if (process.env.NODE_ENV === 'production') {
    return res.status(statusCode).json({
      error: userMessage
    });
  }

  // In development, send detailed error information
  return res.status(statusCode).json({
    error: userMessage,
    details: error.message,
    stack: error.stack
  });
}

module.exports = { handleError };
