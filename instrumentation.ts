import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError: typeof Sentry.captureRequestError = (error, request, context) => {
  const err = error as Error & { digest?: string };
  console.error("[onRequestError]", {
    message: err.message,
    digest: err.digest,
    stack: err.stack,
    route: context?.route?.path ?? "unknown",
    reqPath: request?.url ? new URL(request.url).pathname : "unknown",
  });
  return Sentry.captureRequestError(error, request, context);
};
