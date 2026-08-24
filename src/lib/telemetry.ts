import * as Sentry from "@sentry/react";

export const initTelemetry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION as string | undefined,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0),
    sendDefaultPii: false,
  });
};

export const captureFrontendError = (error: unknown, context: Record<string, unknown> = {}) => {
  if (!(import.meta.env.VITE_SENTRY_DSN as string | undefined)) return;
  Sentry.withScope((scope) => {
    scope.setContext("studyhive", context);
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
  });
};

const serializeFrontendError = (error: unknown) => error instanceof Error
  ? { type: error.name, message: error.message, stack: error.stack }
  : { value: String(error) };

export const reportFrontendError = (
  event: string,
  error: unknown,
  context: Record<string, unknown> = {},
) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "error",
    event,
    ...context,
    error: serializeFrontendError(error),
  }));
  captureFrontendError(error, { event, ...context });
};
