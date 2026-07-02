import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

function safeDump(obj: unknown, depth = 2): string {
  if (depth <= 0) return "[max depth]";
  if (obj === null) return "null";
  if (obj === undefined) return "undefined";
  if (typeof obj === "string") return obj;
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
  if (typeof obj !== "object") return String(obj);
  try {
    const all: Record<string, unknown> = {};
    for (const k of [...Object.getOwnPropertyNames(obj), ...Object.keys(obj)]) {
      try { all[k] = (obj as Record<string, unknown>)[k]; } catch { all[k] = "<error>"; }
    }
    return JSON.stringify(all, (_, v) => {
      if (typeof v === "object" && v !== null) {
        if (depth <= 1) return "[object]";
        return v;
      }
      return v;
    }, 2);
  } catch { return String(obj); }
}

export const onRequestError: typeof Sentry.captureRequestError = (error, request, context) => {
  const err = error as Error & { digest?: string };
  const req = request as { url?: string } | undefined;

  // Dump the raw error object to see all properties before Next.js sanitization
  console.error("[onRequestError:raw]", safeDump(err, 4));
  console.error("[onRequestError:context]", safeDump(context, 4));
  console.error("[onRequestError:request]", safeDump(req, 2));

  console.error("[onRequestError]", {
    message: err.message,
    digest: err.digest,
    stack: err.stack,
    reqPath: req?.url ? new URL(req.url).pathname : "unknown",
  });
  return Sentry.captureRequestError(error, request, context);
};
