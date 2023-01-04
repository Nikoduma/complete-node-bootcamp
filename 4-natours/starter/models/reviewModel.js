const mongoose = require('mongoose'); // per usare MongoDB

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

// 2. creo il modello dallo schema
const Review = mongoose.model('Review', reviewSchema);

//3. esporto
module.exports = Review;
