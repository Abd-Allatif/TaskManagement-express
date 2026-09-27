// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        error: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;