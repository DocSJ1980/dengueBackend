// Custom Error Handler
const errorHandler = (err, req, res, next) => {
    err.message = err.message || "SJ Server Error"
    err.statusCode = err.statusCode || 500

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    })
}

export default errorHandler