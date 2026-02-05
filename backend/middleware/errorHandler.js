// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};

// Custom error class for API errors
export class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ApiError';
    }
}

// Not found handler
export const notFoundHandler = (req, res, next) => {
    const error = new ApiError(404, `Route not found: ${req.originalUrl}`);
    next(error);
};
