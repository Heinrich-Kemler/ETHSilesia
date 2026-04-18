export class ApiError extends Error {
  status: number;
  exposeMessage: boolean;

  constructor(status: number, message: string, exposeMessage = true) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.exposeMessage = exposeMessage;
  }
}

export function toApiError(
  error: unknown,
  fallbackMessage = "Unexpected server error."
): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError(500, fallbackMessage, false);
}

export function logServerError(scope: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`[${scope}]`, error.message);
    return;
  }

  console.error(`[${scope}]`, error);
}
