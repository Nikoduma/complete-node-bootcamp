const mongoose = require('mongoose'); // per usare MongoDB
const Tour = require('./tourModel');

// 1. creo lo schema
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review must have a... review!'],
      trim: true,
      minlength: [20, 'A review must be long at least 20 characters']
    },
    rating: {
      type: Number,
      min: [1, 'A review must have a minumum rating of 1.'],
      max: [5, 'No revire is that amazing! Max 5.0, you scored {VALUE}']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user.']
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// MIDDLEWARE
reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name difficulty'
  //   // select: 'name difficulty ratingsAverage'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  // Dato che mostro una review dentro un tour quando lo cerco singolarmente o lo esplodo in una vista, non è necessario ripostare le info del tour stesso che tanto è già visualizzato. Per cui popolo solo con l'utente.

  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

// Metodo Statico per calcolo media. Verrà chiamato in un MIDDLEWARE. Usiamo un metodo statico perché vogliamo che la chiave this punti al modello su cui sto lavorando (reviewModel). Questo perché voglio usare .aggregate e lo devo usare sul model per farlo funzionare su mongoose.
//==> ogni volta che inserisco una recenzione con Rating, aggiorno la media del rating. Ma la recenzione è vincolata al tour, per cui mi serve il tpur ID.
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0].avgRating,
    ratingsQuantity: stats[0].nRating
  });
};

reviewSchema.post('save', function() {
  // this punta al documento attuale (che viene salvato), punta alle review e calcola le medie quando sono già state salvate => post.
  // dovrei scrivere Review.calcAverageRatings(this.tour) ma non posso farlo, perché venendo tutto eseguito in sequenza, Review ancora non è definito. (lo definisco qui sotto) Ma non posso nemmeno spostare questo dopo la riga dove definisco review, perché altrimenti la definirei senza questo post('save'). La soluzione è usare this.constructor perché punta al costruttore del documento che viene salvato a prescindere dal nome che ha

  this.constructor.calcAverageRatings(this.tour);
});

// 2. creo il modello dallo schema
const Review = mongoose.model('Review', reviewSchema);

//3. esporto
module.exports = Review;
