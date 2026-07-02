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
  console.error("[onRequestError]", {
    message: error?.message,
    digest: (error as Error & { digest?: string }).digest,
    stack: error?.stack,
    route: context?.route?.path ?? "unknown",
    reqPath: request?.url ? new URL(request.url).pathname : "unknown",
  });
  return Sentry.captureRequestError(error, request, context);
};
