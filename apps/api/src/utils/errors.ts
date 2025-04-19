import { StatusCodes } from "http-status-codes";

/**
 * Custom error class for API errors
 * Includes HTTP status code and optional data
 */
export class AppError extends Error {
  statusCode: number;
  data?: any;

  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    data?: any
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.data = data;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert error to JSON format for response
   */
  toJSON() {
    return {
      status: "error",
      message: this.message,
      ...(this.data && { data: this.data }),
    };
  }
}

/**
 * Create a not found error
 */
export function notFound(resource: string): AppError {
  return new AppError(`${resource} not found`, StatusCodes.NOT_FOUND);
}

/**
 * Create a bad request error
 */
export function badRequest(message: string, data?: any): AppError {
  return new AppError(message, StatusCodes.BAD_REQUEST, data);
}

/**
 * Create an unauthorized error
 */
export function unauthorized(message = "Unauthorized"): AppError {
  return new AppError(message, StatusCodes.UNAUTHORIZED);
}

/**
 * Create a forbidden error
 */
export function forbidden(message = "Forbidden"): AppError {
  return new AppError(message, StatusCodes.FORBIDDEN);
}

/**
 * Create a conflict error
 */
export function conflict(message: string): AppError {
  return new AppError(message, StatusCodes.CONFLICT);
}

/**
 * Create an internal server error
 */
export function serverError(message = "Internal server error"): AppError {
  return new AppError(message, StatusCodes.INTERNAL_SERVER_ERROR);
}
