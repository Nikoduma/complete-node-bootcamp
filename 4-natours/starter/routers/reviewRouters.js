const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

// POST /tour/r23452rfw/reviews
// GET /tour/r23452rfw/reviews
// POST /reviews
// con il route sotto, ho accesso a tutte e due le configurazioni sopra. Ance se il TourId viene da un altro route.

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restictTo('user'),
    reviewController.setTouUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .delete(reviewController.deleteReview)
  .patch(authController.protect, reviewController.updateReview);

module.exports = router;
