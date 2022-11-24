const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routers/tourRouters');
const userRouter = require('./routers/userRouters');

const app = express();

// 1) MIDDLEWARE
app.use(morgan('dev'));
app.use(express.json()); // è il middleware per avere i dati in POST su req => mi permette di usare req.body

app.use((req, res, next) => {
  console.log('Hello from the MiddleWare! 👌');
  next(); // SE NON LO SPECIFICO NON OTTENGO NIENTE!
});

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

module.exports = app;
