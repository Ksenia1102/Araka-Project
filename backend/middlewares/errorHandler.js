function errorHandler(err, req, res, next) {
    console.error(err);
    const statusCode = err.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: err.message });
}

module.exports = errorHandler;
