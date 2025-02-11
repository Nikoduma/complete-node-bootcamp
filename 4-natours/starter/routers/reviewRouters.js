const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restictTo('user'),
    reviewController.setTouUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.readReview)
  .delete(
    authController.restictTo('user', 'admin'),
    reviewController.deleteReview
  )
  .patch(
    authController.restictTo('user', 'admin'),
    authController.protect,
    reviewController.updateReview
  );

module.exports = router;
