const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const tourRouter = require('./routers/tourRouters');
const userRouter = require('./routers/userRouters');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// 1) GLOBAL MIDDLEWARE

// Setting HTTP header security
app.use(helmet());

// Development Logging
if (process.env.NODE_ENV === 'development') {
  console.log(process.env.NODE_ENV);
  app.use(morgan('dev'));
}

// Limit the URL requests
const limiter = rateLimit({
  max: process.env.LIMITER_REUQESTS_NUMBER,
  windowMs: process.env.LIMITER_PER_HORS * 60 * 60 * 1000,
  message: 'Too many requests from thid IP. Please try again in one hour.'
}); // limito gli accessi per URL a 100 in un'ora, mando messaggio di errore => da adattare alla app per non renderal inusabile

app.use('/api', limiter); // applichiamo il limiter solo per le richieste al nostro rout API

// Body parsers, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // è il middleware per avere i dati in POST su req => mi permette di usare req.body, limito la dimenzione dei dati passati

// Sanitization contro richieste NoSQL
app.use(mongoSanitize());

// Sanitixation contro XXS
app.use(xss());

// Prevent Parameter Pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'price',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty'
    ]
  })
);

// Serving static files
app.use(express.static(`${__dirname}/public`)); // creo una radice per cercare i file. Adesso nel browser posso accedere al file html con express solo in quella cartella

// app.use((req, res, next) => {
//   console.log('Hello from the MiddleWare! 👌');
//   next(); // SE NON LO SPECIFICO NON OTTENGO NIENTE!
// });

// TEST MiddleWare
app.use((req, res, next) => {
  // faccio un MW per aggiungere alla richesta quando esattamente è stata fatta.
  // Quando app.js parte si mette solo in ascolto, appena ho una richiesta vengono eseguite queste funzioni e tutte le altre in sequenza.
  //Quando app.js parte, le callback vengono registrate e attendon l'evento => la richiesta.
  //la richesta scatena tutto e prende questa data una sola votla (è una callback esterna alle altre, eseguita solo una volta)
  req.requestTime = new Date().toISOString(); // definisco una nuova proprietà o chiave

  next();
});

// 3) ROUTES MOUNTING
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// 4) Se l'esecuzione del codice raggiunge questo punto significa che non è stato catturato da nessun router handler
//Posso quindi definire come gestire i router che non conosco. Per farlo costruisco una middleware Come sempre che prende tutti quanti gli indirizzi possibili e li gestisce

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server.`
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server.`);
  // err.statusCode = 404;
  // err.status = 'fail';
  // next(err);

  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

//ERROR HANDLING GLOBALE
app.use(globalErrorHandler);

module.exports = app;
