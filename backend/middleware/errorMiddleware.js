// Build a consistent 404 error for unknown routes.
const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    const statusCode = err?.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
    const message = err?.message || err?.error?.message || err?.cause?.message || "Internal server error";

    res.status(statusCode).json({
        message,
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
};

module.exports = {
    notFound,
    errorHandler,
};
