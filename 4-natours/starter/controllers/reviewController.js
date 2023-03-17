const Review = require('./../models/reviewModel');
// const APIFeatures = require('./../utils/apiFeatures');
// const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFacotry');

// METODI

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   const features = new APIFeatures(Review.find(filter), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const reviews = await features.query;

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: { reviews }
//   });
// });

// creo un middleware per la creazione di una review e settare l'ID di Tiour e User per la Review stessa,
exports.setTouUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.createReview = factory.create(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.readReview = factory.readOne(Review);
