const Tour = require('./../models/tourModel');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');

// ALIASES
exports.aliasTopTour = (req, res, next) => {
  //preimposto l'url della query. sonontutte stringhe
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,-price';
  req.query.fields = 'name,price,ratingsAverage,difficulty';
  next();
};

// METODI
exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours }
  });
  // try {
  // // } catch (error) {
  // //   res.status(404).json({
  // //     status: 'Fail',
  // //     message: error
  // //   });
  // // }
});

exports.getOneTour = catchAsync(async (req, res, next) => {
  // const tour = await Tour.findById(req.params.id, () => {
  //   return next(
  //     new AppError(`No tour found with that ID: ${req.params.id}`, 404)
  //   );
  // });

  const tour = await Tour.findById(req.params.id).populate('review');

  res.status(200).json({
    status: 'success',
    data: { tour }
  });
  // try {
  // } catch (error) {
  //   res.status(404).json({
  //     status: 'Fail',
  //     message: error
  //   });
  // }
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { tour: newTour }
  });
  // try {
  // } catch (error) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: error
  //   });
  // }
});

exports.updateTour = catchAsync(async (req, res, next) => {
  // se voglio verificare con i validatori devo indicarlo
  // const tour = await Tour.findByIdAndUpdate(
  //   req.params.id,
  //   req.body,
  //   {
  //     new: true,
  //     runValidators: true
  //   }, // Posso definire quiuna modalità di cattura dell'errore, però non riesco a catturare l'errore di validazione per cui devo fare una routine a parte. La routine è in error controller
  //   () => {
  //     return next(new AppError('No tour found with that ID', 404));
  //   }
  // );

  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      tour: tour
    }
  });
  //   try {
  // } catch (error) {
  //   res.status(404).json({
  //     status: 'Fail',
  //     message: error
  //   });
  // }
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  await Tour.findByIdAndDelete(req.params.id, () => {
    return next(new AppError('No tour found with that ID', 404));
  });
  res.status(204).json({
    status: 'success',
    data: {
      message: 'Deleted'
    }
  });
  // try {
  // } catch (error) {
  //   res.status(404).json({
  //     status: 'Fail',
  //     message: error
  //   });
  // }
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        // definisco delle chiavi di aggregazione.
        // _id: null,
        // _id: '$difficulty', // è il campo per cui raggruppare per il calcolo, null se su tutti i campi
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 }, // conto il numero delle occorrenze in match, il numero dei tours, quelli con rating, cioè tutti.
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' }, // uso $ + nome del campo per cui raggruppare
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    { $sort: { avgPrice: 1 } }
    // {
    //   $match: { _id: { $ne: 'EASY' } } // NOT EQUAL to easy - possiamo usare match sulle chiavi appena create
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: stats
  });
  //     try {
  // } catch (error) {
  //   res.status(404).json({
  //     status: 'Fail',
  //     message: error
  //   });
  // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursMonth: { $sum: 1 },
        tours: { $push: '$name' } // con Push creo un array con i nomi dei tour
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      // Questo imponela visualizzazione o il nascondere un determinato campo, se e zero e nascosto
      $project: {
        _id: 0
      }
    },
    {
      $sort: {
        numToursMonth: -1,
        month: 1
      }
    }
    // {
    //   $limit: 5
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: plan
  });
});
