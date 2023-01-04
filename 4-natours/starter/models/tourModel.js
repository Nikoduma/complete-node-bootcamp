const mongoose = require('mongoose'); // per usare MongoDB
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

// 1. creo lo schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // se metto true, posso farlo con un array con l'errore di validazione
      unique: true,
      trim: true, // leva gli Spazi bianchi all'inizio e alla fine
      maxlength: [40, 'A tour name must be long no more than 40 characters'],
      minlength: [10, 'A tour name must be long at least 10 characters']
      // validate: [validator.isAlpha, 'Only characters'] //Lo elimino perché non considera gli spazi come caratteri e quindi da errore
    },
    slug: String,
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
      trim: true,
      enum: {
        values: ['easy', 'difficult', 'medium'],
        message:
          'Difficulty is: easy, medium or difficuly. {VALUE} is not supported'
      }
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      //Il validatore funziona soltanto in fase di creazione ma mai in fase di update. Solo se sto creando un documento la chiave this è il documento che sto cercando di inserire. Altrimenti no, da errore
      validate: {
        validator: function(val) {
          return val < this.price; // deve tornare true o false
        },
        message: 'Il prezzo scontato dovrebbe essere più basso del prezzo'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A tour must have a rating.'],
      max: [5, 'No tour is that amazing! Max 5.0, you scored {VALUE}']
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
    startDates: [Date],
    secretTours: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON => questo non è un oggetto di opzioni dello schema, come sopra, ma è un oggetto embedded con proprietà. E' composto da due proprietà: type e coordinates, ognuno dei due prende opzioni di schema
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'] // vogliamo che sia solo point e non poligon o altro.
      },
      coordinates: [Number], // un array di numeri IN questo caso abbiamo prima la longitudine, poi la latitudine (l'opposto di google)
      address: String,
      description: String
    },
    locations: [
      {
        // costruisco un array di posizoini
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'] // vogliamo che sia solo point e non poligon o altro.
        },
        coordinates: [Number], // un array di numeri IN questo caso abbiamo prima la longitudine, poi la latitudine (l'opposto di google)
        address: String,
        description: String,
        day: Number // la stasrtLocation potrebbe essere al giorno 0, ma ha deciso di avere una proprietà separata
      }
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
  },
  {
    // Specifico qui i parametri dello schema sono fuori dallo schema stesso, come secondo oggetto nella definizione dello schema. Adesso specifico che ogni volta che si effettua l'estrazione sia in JSON sia in oggetto dello schema,le chiavi virtuali compaiono
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// 1.1 Virtual properties
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// Virtual Populate
tourSchema.virtual('review', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// 1.2 Document middleware: Vengono lanciati prima .save() e .create() => invece .insertMany() Non scatena il middleware Basato su Save
//
tourSchema.pre('save', function(next) {
  //this al documento da salvare
  this.slug = slugify(this.name, { lower: true });
  next();
});

// EMBEDDING di un documento nel pre-save => non funziona più, la definizione del dato guides è cambiato nello schema per procedere nel corso => era guides: Array
// tourSchema.pre('save', async function(next) {
//   // nel body della richiesta c'è l'aray guide con gli ID di chi è la guida del tour. Quello che voglio fare è sostituire questi ID con i dati effettivi delle guide. Lo faccio con questo middleware.
//   //Dovendo fare una lettura den db, devo usare una funzione asincrona nel map()

//   const guidesPromise = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// 1.3 Query middleware
//In questo caso l' hook e find
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
  //this punta alla query
  this.find({ secretTours: { $ne: true } });
  this.start = Date.now(); // È un oggetto come un'altro e posso aggiungere chiavi e proprietà
  next();
});

// Popolo le guide
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -id -passwordChangedAt'
  });
  next();
});

// // Popolo con le reviwes tutti i tour, meglio solo uno per cui vado nel cotroller e lo impongo al get one,
// tourSchema.pre('findOne', function(next) {
//   this.populate({
//     path: 'review'
//   });
//   next();
// });

tourSchema.post(/^find/, function(docs, next) {
  // Ho accesso a tutti i documenti che vengono estratti dalla selezionequindi docs
  // console.log(docs);
  // this punta al documento corrente

  console.log(`the query tooks ${Date.now() - this.start} milliseconds.`);
  next();
});

// 1.3 Aggregatio middleware
tourSchema.pre('aggregate', function(next) {
  // this punta all'oggetto di aggregazione, che è un array
  this.pipeline().unshift({ $match: { secretTours: { $ne: true } } });
  console.log(this.pipeline());
  next();
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
