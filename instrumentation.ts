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
  const req = request as { url?: string; path?: string } | undefined;
  const ctx = context as { routePath?: string } | undefined;
  let reqPath = "unknown";
  if (req?.path) reqPath = req.path;
  else if (req?.url) reqPath = req.url;
  console.error("[onRequestError]", {
    message: err.message,
    digest: err.digest,
    stack: err.stack,
    routePath: ctx?.routePath,
    reqPath,
  });
  return Sentry.captureRequestError(error, request, context);
};
