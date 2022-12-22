const User = require('./../models/userModel');
// const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const filterObj = (obj, ...paramFilter) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (paramFilter.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const users = await features.query;

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users }
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create error if user POSTs a password
  // la password non può essere aggiorana Qui
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'You cannot update the password from here! Please use /updateMyPassword',
        400
      )
    );
  }
  // 2. vogliamo inoltr filtrare il req.body affinchè possano essere modificati solo dati che permettiamo noi.
  // per esempio non deve mai essere modificato body.role = "admin", qualcuno potrebbe inserirlo nel body in qualche modo.Quindi passiamo filteredBody invece di req.body.Creiamo una funzione in cui passiamo body ed i campi che voglio filtrare
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3. Update User document
  // non modificando dati sensibili: password e email, posso usare findByIdandUpdate

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  // 3. Send confirmation
  res.status(200).json({
    status: 'success',
    data: { user: updatedUser }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {
    active: false
  });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: `error`,
    message: 'This route is not defined!'
  });
};
exports.getOneUser = (req, res) => {
  res.status(500).json({
    status: `error`,
    message: 'This route is not defined!'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: `error`,
    message: 'This route is not defined!'
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: `error`,
    message: 'This route is not defined!'
  });
};
