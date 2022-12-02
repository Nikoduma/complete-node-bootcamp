const mongoose = require('mongoose'); // per usare MongoDB

// 1. creo lo schema
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'], // se metto true, posso farlo con un array con l'errore di validazione
    unique: true,
    trim: true // leva gli Spazi bianchi all'inizio e alla fine
  },
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size']
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  priceDiscount: Number,
  ratingsAverage: {
    type: Number,
    default: 4.5
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a summary']
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a cover image']
  },
  images: [String], // un array di stringhe
  createdAt: {
    type: Date,
    default: Date.now,
    select: false // non lo mostra mai nelle query, non lo manda mai al client
  },
  startDates: [Date]
});

// 2. creo il modello dallo schema => i modello hanno la prima lettera maiuscola.
const Tour = mongoose.model('Tour', tourSchema);

//3. esporto
module.exports = Tour;

/* // nuovo documento
const testTour = new Tour({
    name: 'The Park Camper',
    price: 997
  });
  
  testTour
    .save()
    .then(doc => {
      console.log(doc);
    })
    .catch(err => {
      console.log('ERROR :', err);
    });
   */
