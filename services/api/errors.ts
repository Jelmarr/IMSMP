import { AxiosError } from "axios";

export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

export class ApiError<T = unknown> extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: ValidationErrors<T>,
  ) {
    super(message);
  }
}
export function normalizeApiError<T>(error: unknown): ApiError<T> {
  if (error instanceof AxiosError) {
    // Look specifically for the 'errors' object in your JSON response
    const backendErrors = error.response?.data?.errors;

    return new ApiError<T>(
      error.response?.status ?? 500,
      error.response?.data?.message ?? "Request failed",
      backendErrors, // This is T (ValidationErrors)
    );
  }
  return new ApiError(500, "Unexpected error");
}
