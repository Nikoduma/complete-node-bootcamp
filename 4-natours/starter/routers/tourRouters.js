const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');

const router = express.Router();

// router.param('id', tourController.checkID);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTour, tourController.getAllTours); // uso un middleware per precompilare la query

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);
router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  //.post(tourController.checkBody, tourController.createTour); // la prima funzione è un middleware, se torna next, procede alla seconda
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getOneTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// il route per scrivere le review è dentro il route del tour, perché ne è dipendente, nel rapporto 1 : molti è la parte molti e deve avere il collegamento con il tour. Viene però usato nel reviewController.
router
  .route('/:tourId/reviews/')
  .get()
  .post(
    authController.protect,
    authController.restictTo('user'),
    reviewController.createReview
  );

module.exports = router;
