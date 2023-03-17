const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFacotry');

// ALIASES
exports.aliasTopTour = (req, res, next) => {
  //preimposto l'url della query. sonontutte stringhe
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,-price';
  req.query.fields = 'name,price,ratingsAverage,difficulty';
  next();
};

// METODI
exports.getAllTours = factory.getAll(Tour);

exports.getOneTour = factory.readOne(Tour, {
  path: 'reviews'
});
exports.createTour = factory.create(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
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
