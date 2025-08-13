import debug from 'debug';

/**
 * Error Handling middleware that logs error and sends a formatted JSON response.
 *
 * @param {Error} err - The error object that was thrown
 * @param {import('express').Request} req - The Express request object (unused)
 * @param {import('express').Response} res - The Express Response object
 * @param {import('express').NextFunction} next - The Express next function (unused)
 * @returns {import('express').Response} - The response with the appropriate HTTP status and message
 */
// eslint-disable-next-line no-unused-vars
export function errorHandlerMiddleware(err, req, res, next) {
  const log = debug('express-api:error');

  log(err.stack); // Log error for debugging

  const statusCode = err.statusCode || 500; // Default to 500 if no status code is provided
  const message = err.message || 'Something went wrong.'; // Default error message

  return res.status(statusCode).json('toJSON' in err ? err : { error: message });
}