/**
 * Standardized API error response handler
 */

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export class AppError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string = "INTERNAL_ERROR", status: number = 500) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "AppError";
  }
}

// Common error types
export const Errors = {
  UNAUTHORIZED: () =>
    new AppError("Unauthorized. Please log in.", "UNAUTHORIZED", 401),
  FORBIDDEN: (reason: string = "You don't have permission to perform this action") =>
    new AppError(reason, "FORBIDDEN", 403),
  NOT_FOUND: (entity: string = "Resource") =>
    new AppError(`${entity} not found`, "NOT_FOUND", 404),
  VALIDATION_ERROR: (message: string) =>
    new AppError(message, "VALIDATION_ERROR", 400),
  CONFLICT: (message: string) =>
    new AppError(message, "CONFLICT", 409),
  INTERNAL_ERROR: (message: string = "Internal server error") =>
    new AppError(message, "INTERNAL_ERROR", 500),
};

/**
 * Parse Supabase errors and return user-friendly messages
 */
export function parseSupabaseError(error: any): AppError {
  const body = error.error?.body?.details || error.message || "";
  const message = error.message || "";

  // RLS policy errors
  if (
    message.includes("row-level security") ||
    message.includes("violates row-level security")
  ) {
    return Errors.FORBIDDEN(
      "You don't have permission to perform this action. Please contact an administrator."
    );
  }

  // Foreign key constraint errors
  if (message.includes("foreign key constraint")) {
    return new AppError(
      "Cannot perform this action due to existing relationships in the system.",
      "CONSTRAINT_ERROR",
      409
    );
  }

  // Unique constraint errors
  if (message.includes("duplicate") || message.includes("unique")) {
    return Errors.CONFLICT(
      "This record already exists. Duplicate values are not allowed."
    );
  }

  // Not found errors
  if (message.includes("cannot find") || message.includes("not found")) {
    return Errors.NOT_FOUND("Record");
  }

  // Default
  return Errors.INTERNAL_ERROR(message || "An error occurred");
}

/**
 * Send error response
 */
export function sendErrorResponse(error: any) {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else {
    appError = parseSupabaseError(error);
  }

  const statusCode = appError.status || 500;
  const response = {
    error: true,
    code: appError.code,
    message: appError.message,
  };

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Send success response
 */
export function sendSuccessResponse(data: any, status: number = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}
