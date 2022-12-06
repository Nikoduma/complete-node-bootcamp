class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // La classe Error prende come unico input soltanto una stringa the chi è il messaggio, per cui non ho bisogno di specificare this.message, Ma viene proprio fatta direttamente da Error

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; //statusCode è un numro, lo trasformo in stringa e se inizia con...
    this.isOperational = true; // creo una proprietà che indica il tipo di errore. È un trucco per differenziare i tipi di errori visto che quelli di programmazione sicuramente non hanno questa proprietà da testare

    Error.captureStackTrace(this, this.constructor); //Per fare in modo che venga registrato comunquelo stack trace dell'errore E che nella console si possa vedere da dove è nato.
  }
}

module.exports = AppError;
