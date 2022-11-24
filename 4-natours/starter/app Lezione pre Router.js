const fs = require('fs');
const express = require('express');
const morgan = require('morgan');

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

// 2) ROUTES HANDLERS

// leggo il file dei tours, è fupri dalle callback, non va nell'event loop, non è bloccante
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

// FUNZIONI
//Leggo tutti i tours
const getAllTours = (req, res) => {
  console.log(req.requestTime);
  // rispondo con nel formato Jsend
  // il nome dei dai è con chiave tours: che è il nome della risorsa API che sto creando.
  // in questo caso posso non specificare il nome in quanto in ES6 se chiave e valore (variabile) sono uguali, non è necessario farlo. potevo scrivere => data: { tours: tours }, ma scrivo => data: { tours },
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: { tours },
  });
};

// Mostro uno specifico Tour
// il parametro è indicato come un nome variabile dopo i due punti: id, posso passare più paramentri: id /: x /: y
// Se sono multipli, tutti i parametri devono essere specificati. Se non voglio specificarne uno, lo metto opzionale :id/:x/:y?
// posso mettere opzionale solo l'ultimo
const getOneTour = (req, res) => {
  // console.log(req.params);

  const id = +req.params.id;
  const tour = tours.find((el) => el.id === id);

  // if (id > tours.length) {
  if (!tour) {
    res.status(404).json({
      status: 'Fail',
      message: 'Invalid Id.',
    });
    return;
  }

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
};

// Creo un tour
const createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body); // unisce due oggetti in un nuovo oggetto => non modifico il dato ma ne creo uno nuovo

  // tours è un array di oggetti => posso usare .push()
  tours.push(newTour);

  // sono dentro una callback, per cui uso la scrittura asincrona
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      // 201 => scritto con successo, indico poi cosa ho scritto
      res.status(201).json({
        status: 'success',
        data: { tour: newTour },
      });
    }
  );

  // res.send('Done.'); // non posso mettere questa risposta perché sarebbe un doppione e da errore.
};

// modifico il tour => modifico solo quello che devo modificare.
const updateTour = (req, res) => {
  // faccio solo l'hamndler non lo codifico
  if (+req.params.id > tours.length) {
    res.status(404).json({
      status: 'Fail',
      message: 'Invalid Id.',
    });
    return;
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here....>',
    },
  });
};

const deleteTour = (req, res) => {
  // faccio solo l'hamndler non lo codifico
  if (+req.params.id > tours.length) {
    res.status(404).json({
      status: 'Fail',
      message: 'Invalid Id.',
    });
    return;
  }

  // risposta 204 => niente contenuto, risponde con null perché adesso abbiamo cancellato
  res.status(204).json({
    status: 'success',
    data: null,
  });
};

const getAllUsers = (req, res) => {
  res.status(500).json({
    status: `error`,
    message: 'This route is not defined!',
  });
};
const createUser = (req, res) => {
  res.status(500).json({
    status: `error`,
    message: 'This route is not defined!',
  });
};
const getOneUser = (req, res) => {
  res.status(500).json({
    status: `error`,
    message: 'This route is not defined!',
  });
};
const updateUser = (req, res) => {
  res.status(500).json({
    status: `error`,
    message: 'This route is not defined!',
  });
};
const deleteUser = (req, res) => {
  res.status(500).json({
    status: `error`,
    message: 'This route is not defined!',
  });
};

// 3) ROUTES
// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id', getOneTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// Tours Routes

app.route('/api/v1/tours').get(getAllTours).post(createTour);

app
  .route('/api/v1/tours/:id')
  .get(getOneTour)
  .patch(updateTour)
  .delete(deleteTour);

// Users Routes
app.route('/api/v1/users').get(getAllUsers).post(createUser);

app
  .route('/api/v1/users/:id')
  .get(getOneUser)
  .patch(updateUser)
  .delete(deleteUser);

// 4) START SERVER
const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
});
