const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const AppError = require('./../utils/appError');
const catchAsync = require('../utils/catchAsync');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Creo il metodo per iscriversi al sistema,lo definisco come una funzione asincrona perché devo fare delle operazioni sul database.Aggiungo la variabile next per gestire l'errore. Anche qui uso la funzione catchAsync() per gestire l'errore
exports.signUp = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body); // => In questo modo possiamo incorrere in errori di autenticazione per esempio passando direttamente il body della della request chiunque potrebbe passare la creazione di un utente amministrativo. Si per cui è meglio scrivere il codice come sotto. Per come ha scritto qui sotto possiamo solo far passare al server i dati che riteniamo necessari. Se vogliamo creare un utente amministrativo basta crearlo con questo sistema, puoi entrare nel database manualmente e impostarlo come come admin

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: { user: newUser }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Verifica che email e password esistano
  if (!email || !password) {
    return next(
      new AppError('Please provide a valid email and password!', 400)
    );
  }
  // 2) verifica che l'utente esista && la password sia corretta
  const user = await User.findOne({ email }).select('+password'); // che è uguale a User.findOne({ email: email }), Aggiungo il campo select con il nome del campo che voglio vedere nell'output e che è nascosto

  // La verifica che la password sia corretta viene fatta negli user Module dove abbiamo il pacchetto bcrypt. Si Crea un metodo di istanza. Il metodo istanza deve essere eseguito soltanto se l'utente esiste, visto che prende un dato contenente dentro l'oggetto user. Lo inserisco quindi direttamente dentro l'if e con l'operatore OR, se esiste l'utente fa anche la verifica della correttezza della password altrimenti non fa niente.

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect user or password.', 401)); // Controlliamo utente e password insieme in questo modo non diamo un'informazione che una delle due almeno è corretta
  }

  // 3) invia al client il token JWT

  const token = signToken(user._id);
  res.status(201).json({
    status: 'success',
    token
  });
});

//Creo un metodo che poi utilizzerò come middleware per verificare la protezione del route
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1) Vedere se il token esisterà
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not loggrd in!', 401));
  }
  // 2) Verificare la validità del token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //<= chiamo subito la funzione e la aspetto

  //3) Verifica che l'utente esista esista ancora
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(
      new AppError('The user belongings to this token, does no longer exist.'),
      401
    );

  // 4) Verifica se l'utente ha cambiato la password Dopo che il token è stato emesso
  // la Logica qui è associata all'utente, la inseriamo direttamente nello schema
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('This token is not more valid. Password changed.')
    );
  }

  // ha accesso al route. Variabile req è l'unica che passa attraverso tutti i middleware inalterata, per cui è il posto dove inserire i dati. Qui definiamo quello che è attualmente il current user
  req.user = currentUser;
  next();
});

exports.restictTo = (...roles) => {
  return (req, res, next) => {
    // roles è un array => ['admin', 'lead-guide']
    // Abbiamo accesso al ruolo dell'utente perché nel middleware precedente, .protect, abbiamo imposto => req.user = currentUser
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};
