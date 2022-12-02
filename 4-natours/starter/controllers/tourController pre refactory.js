const fs = require('fs');
const Tour = require('../models/tourModel');

// leggo il file dei tours, è fupri dalle callback, non va nell'event loop, non è bloccante
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

exports.getAllTours = (req, res) => {
  console.log(req.requestTime);

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: { tours }
  });
};

// Creo una funzione da usare in un middlware per validare l'ID, invece di validarlo in più parti del codice.
exports.checkID = (req, res, next, val) => {
  console.log(`Tour id is: ${val}`);
  if (+req.params.id > tours.length) {
    return res.status(404).json({
      status: 'Fail',
      message: 'Invalid Id.'
    });
  }
  next();
};

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'Fail',
      message: 'Invalid Body.'
    });
  }
  next();
};

exports.getOneTour = (req, res) => {
  const id = +req.params.id;
  const tour = tours.find(el => el.id === id);

  /*   if (!tour) {
    res.status(404).json({
      status: 'Fail',
      message: 'Invalid Id.',
    });
    return;
  } */

  res.status(200).json({
    status: 'success',
    data: { tour }
  });
};

exports.createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body); // unisce due oggetti in un nuovo oggetto => non modifico il dato ma ne creo uno nuovo

  tours.push(newTour);

  // sono dentro una callback, per cui uso la scrittura asincrona
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    err => {
      // 201 => scritto con successo, indico poi cosa ho scritto
      res.status(201).json({
        status: 'success',
        data: { tour: newTour }
      });
    }
  );
};

// modifico il tour => modifico solo quello che devo modificare.
exports.updateTour = (req, res) => {
  // faccio solo l'hamndler non lo codifico
  /*   if (+req.params.id > tours.length) {
    res.status(404).json({
      status: 'Fail',
      message: 'Invalid Id.',
    });
    return;
  } */

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here....>'
    }
  });
};

exports.deleteTour = (req, res) => {
  // faccio solo l'handler non lo codifico
  /*   if (+req.params.id > tours.length) {
    res.status(404).json({
      status: 'Fail',
      message: 'Invalid Id.',
    });
    return;
  } */

  // risposta 204 => niente contenuto, risponde con null perché adesso abbiamo cancellato
  res.status(204).json({
    status: 'success',
    data: null
  });
};
