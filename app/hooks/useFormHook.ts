import { ApiError } from "@/services/api/errors";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { FieldValues, Path, UseFormSetError } from "react-hook-form";

export function useFormHook<T extends FieldValues>(
  setError: UseFormSetError<T>,
  onSuccess?: () => void,
) {
  const router = useRouter();

  const handleErrors = useCallback(
    (errors: Record<string, string>) => {
      Object.entries(errors).forEach(([field, message]) => {
        setError(field as Path<T>, {
          type: "server",
          message,
        });
      });
    },
    [setError],
  );

  const handleSubmitWrapper = useCallback(
    async (submitFn: () => Promise<unknown>) => {
      try {
        await submitFn();

        // Handle success
        onSuccess?.();
        router.refresh();
        return true;
      } catch (error) {
        console.error("Submit error:", error);

        // Handle ApiError with validation errors
        if (error instanceof ApiError) {
          if (
            (error.statusCode === 400 || error.statusCode === 422) &&
            error.errors
          ) {
            handleErrors(error.errors as Record<string, string>);
          } else {
            // Handle other API errors (500, 404, etc.)
            setError("root.serverError" as Path<T>, {
              type: "server",
              message: error.message,
            });
          }
        } else {
          // Handle unexpected errors
          setError("root.serverError" as Path<T>, {
            type: "server",
            message: "An unexpected error occurred",
          });
        }

        return false;
      }
    },
    [handleErrors, onSuccess, router, setError],
  );

  return { handleSubmitWrapper };
}
