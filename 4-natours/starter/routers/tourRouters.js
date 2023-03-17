const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
// const reviewController = require('./../controllers/reviewController');
const reviewRouters = require('./../routers/reviewRouters');

const router = express.Router();

// router.param('id', tourController.checkID);

// mergeParams => uso un middlewareper indicare che una volta passato /tour/ se incontra quanto scritto, passi a reviewRouters
router.use('/:tourId/reviews', reviewRouters);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTour, tourController.getAllTours); // uso un middleware per precompilare la query

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );
router
  .route('/')
  .get(tourController.getAllTours)
  //.post(tourController.checkBody, tourController.createTour); // la prima funzione è un middleware, se torna next, procede alla seconda
  .post(
    authController.protect,
    authController.restictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getOneTour)
  .patch(
    authController.protect,
    authController.restictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// il route per scrivere le review è dentro il route del tour, perché ne è dipendente, nel rapporto 1 : molti è la parte molti e deve avere il collegamento con il tour. Viene però usato nel reviewController. ==> In reatlà non lo usiamo in questo modo, ma usiamo il metodo del MERGEPARAM.
// router
//   .route('/:tourId/reviews/')
//   .get()
//   .post(
//     authController.protect,
//     authController.restictTo('user'),
//     reviewController.createReview
//   );

module.exports = router;
