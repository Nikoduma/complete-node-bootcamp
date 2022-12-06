const fs = require('fs');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const AppError = require('./../utils/appError');

// ALIASES
exports.aliasTopTour = (req, res, next) => {
  //preimposto l'url della query. sonontutte stringhe
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,-price';
  req.query.fields = 'name,price,ratingsAverage,difficulty';
  next();
};

// METODI
exports.getAllTours = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(404).json({
      status: 'Fail',
      message: error
    });
  }
};

exports.getOneTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: { tour }
    });
  } catch (error) {
    res.status(404).json({
      status: 'Fail',
      message: error
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { tour: newTour }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error
    });
  }
};

exports.updateTour = async (req, res) => {
  // se voglio verificare con i validatori devo indicarlo
  try {
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
  } catch (error) {
    res.status(404).json({
      status: 'Fail',
      message: error
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: {
        message: 'Deleted'
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'Fail',
      message: error
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(404).json({
      status: 'Fail',
      message: error
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(404).json({
      status: 'Fail',
      message: error
    });
  }
};
