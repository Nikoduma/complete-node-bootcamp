module.exports = (err, req, res, next) => {
  // console.error(err.stack);
  // Definisco dei default
  err.statusCode = err.statusCode || 500; // 500=> internal server error
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
};
