import type { ErrorRequestHandler, RequestHandler, Response } from "express";

const errorCopy = new Map([
  [400, { title: "Bad request", message: "Check your input and try again." }],
  [
    401,
    {
      title: "Sign-in failed",
      message: "Check your sign-in details and try again.",
    },
  ],
  [
    403,
    {
      title: "Access denied",
      message: "You do not have permission to view this page.",
    },
  ],
  [
    404,
    {
      title: "Page not found",
      message: "The page you requested could not be found.",
    },
  ],
  [
    409,
    {
      title: "Request conflict",
      message: "The request conflicts with existing data.",
    },
  ],
  [
    413,
    {
      title: "Request too large",
      message: "Reduce the size of your submission and try again.",
    },
  ],
]);

/**
 * Renders an error with its HTTP status and player-facing copy. The layout
 * also works when a request fails before the session and navigation load.
 */
export function renderError(
  res: Response,
  status: number,
  details?: {
    title?: string;
    message?: string;
    recoveryLink?: { href: string; label: string };
  },
) {
  const copy =
    errorCopy.get(status) ??
    (status >= 500
      ? {
          title: "Server error",
          message: "Something went wrong. Please try again later.",
        }
      : {
          title: "Request failed",
          message: "Drevan could not process your request.",
        });

  return res.status(status).render("error", {
    status,
    title: details?.title ?? copy.title,
    message: details?.message ?? copy.message,
    recoveryLink: details?.recoveryLink,
    user: res.locals.user ?? null,
    currentPath: res.locals.currentPath ?? "",
  });
}

export const handleNotFound: RequestHandler = (_req, res) => {
  renderError(res, 404);
};

export const handleError: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    return next(error);
  }

  // Express and its request parsers attach an HTTP status to client errors.
  const reportedStatus =
    typeof error === "object" && error !== null && "status" in error
      ? error.status
      : undefined;
  const status =
    typeof reportedStatus === "number" &&
    Number.isInteger(reportedStatus) &&
    reportedStatus >= 400 &&
    reportedStatus <= 599
      ? reportedStatus
      : 500;

  if (status >= 500) {
    console.error(error);
  }

  renderError(res, status);
};
