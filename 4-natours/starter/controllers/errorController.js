const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  //Ho già catturato l'errore in tour controller linea 41,Per cui questa routine probabilmente non viene mai eseguita
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  // Estraggo il valore del campo duplicato da message
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate field: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors)
    .map(er => er.message)
    .join('; ');
  const message = `Invalid input data: ${errors}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid Token. Please log in!', 401);

const handleJWTExpiredError = () =>
  new AppError('Login expired! Please log in again.', 401);

const sendErrDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrProd = (err, res) => {
  //Nella classe dell'errore abbiamo definito noi stessi la variabile ISO operational e l'abbiamo messa a true, per cui in caso questo non sia vero, significa che l'errore è più grave e viene per esempio da al server o da componenti di terze parti
  // Errore fidato, possiamo mandarlo al client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Errore sconosciuto non lo mandiamo al client
    //Qui gestiamo tutti gli altri errori che non sono presi dagli if precedenti.In questo caso si possono gestire anche delle eccezioni che non sono catturate Dal middleware Per la cattura delle eccezioni.

    // 1. console
    console.error(err);

    //2. client
    res.status(500).json({
      status: 'error',
      message: 'Something went very very wrong...!'
    });
  }
};

module.exports = (err, req, res, next) => {
  // console.error(err.stack);
  // Definisco dei default
  err.statusCode = err.statusCode || 500; // 500=> internal server error
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Gli errori che vengono da database sono indicati come cast errors e li posso catturare qui e trasformarli con una funzione in un errore più gestibile
    // sono gli errori di mongoose
    let error = Object.assign(err);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    //Se non è nessuno degli errori precedenti, Entra in questa funzione direttamente e finisce nella gestione dell'errore con lo status cod 500
    sendErrProd(error, res);
  }
};
