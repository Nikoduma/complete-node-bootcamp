const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');

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

module.exports = router;
