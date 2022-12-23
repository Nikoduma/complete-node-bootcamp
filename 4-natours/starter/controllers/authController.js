/* eslint-disable no-plusplus */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const AppError = require('./../utils/appError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createAndSandToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  // Definisco le opzioni dei cookie
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: false, // ain DEV funziona anche con HTTP e non solo con HTTPS
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOption.secure = true; // in production funziona solo con HTTPS
  res.cookie('jwt', token, cookieOption);

  // Nascondo Password e LoginAttempt dall'output (non modifico il DB o l'utente creato perché non lo salvo)
  user.password = undefined;
  user.loginAttempt = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user: user }
  });
};

// creo la variabile per il timer Login Attempt
let timerLogIn;

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

  createAndSandToken(newUser, 201, res);
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
  const user = await User.findOne({ email })
    .select('+password')
    .select('+loginAttempt'); // che è uguale a User.findOne({ email: email }), Aggiungo il campo select con il nome del campo che voglio vedere nell'output e che è nascosto

  // La verifica che la password sia corretta viene fatta negli user Module dove abbiamo il pacchetto bcrypt. Si Crea un metodo di istanza. Il metodo istanza deve essere eseguito soltanto se l'utente esiste, visto che prende un dato contenuto dentro l'oggetto user. Lo inserisco quindi direttamente dentro l'if e con l'operatore OR, se esiste l'utente fa anche la verifica della correttezza della password altrimenti non fa niente.

  if (!user || !(await user.correctPassword(password, user.password))) {
    // LOGIN ATTEMPT => controllo che non si sia raggiunto il numero massimo di login
    if (user.loginAttempt > process.env.LOGIN_ATTEMPT) {
      // Se c'e n'è uno attico, azzera timer per reset attempt
      if (timerLogIn) clearTimeout(timerLogIn);

      // Crea il timer per reset Attempt
      timerLogIn = await user.resetLoginTimer();

      // Ritorna messaggio
      return next(
        new AppError(
          'You have tried to log-in too many time with wrong credential. PLease try again after 10 minutes.',
          401
        )
      );
    }

    await user.wrongAttempt();

    return next(new AppError('Incorrect user or password.', 401)); // Controlliamo utente e password insieme in questo modo non diamo un'informazione che una delle due almeno è corretta
  }

  // Se ci sono attempt fatti, adesso li annulla e annulla eventiali timers
  if (user.loginAttempt > 0) {
    if (timerLogIn) clearTimeout(timerLogIn);
    await user.resetLoginAttempt();
  }

  // 3) invia al client il token JWT

  createAndSandToken(user, 200, res);
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

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  // 2) generate random token
  // essendo Qualche linea di codice Ed essendo relativo all'utente lo mettiamo nello userModel
  const resetToken = user.createPasswordResetToken();

  // l'utente è Stato modificato nella funzione sopra, ma non è stato salvato per cui lo salvo adesso.Devo però disattivare tutti i validatori perché ho cambiato soltanto due dati, E non c'è nessuno dei campi richiesti che vi sto andando a salvare per cui darebbe errore
  await user.save({ validateBeforeSave: false });

  // 3) send token via email
  // Mandiamo direttamente l'url per fare il reset della Password
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit e PATCH request with your New password and passwordconfirm to: ${resetURL}.\nIf you didn't forget your password please ignore this message.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes).',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to the user email.'
    });
  } catch (error) {
    // In caso di un qualsiasi errore annullo la presenza se del token che della sua scadenza
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });

    next(
      new AppError(
        'There was an error sending the email. Try again later.',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1.Cerca l'utente in funzione del token passato dal link
  //Clicchiamo il token ricevuto dal link e lo compariamo con quello salvato in memoria. Lo troviamo dentro req.param.token per come lo abbiamo definito all'interno della stringa del link.
  // Posso anche creare una funzione a parte che fa questa Criptatura perché la uso due volte.
  console.log(req.params.token);
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpire: { $gt: Date.now() }
  });

  // 2. Verifica che il token non sia scaduto e che l'utente esista, Imposta nuova Password
  if (!user) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }

  // 3. Aggiorna la proprietà password cambiata il: passwordChangedAt
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  await user.save(); // Ci penserà il middleware pre-save a fare la criptatura della password, Infatti non spengiamo i validatori
  // 4. Manda il JWT Al client per effettuare il login. È anche il motivo per cui utilizziamo Save e non update, proprio perché vogliamo che parta il middleware di Save e partano i validatori
  createAndSandToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  // L'utente è già loggato per cui hoil suo id perché è stato inserito nel middleware protect
  const user = await User.findById(req.user.id).select('+password');

  // 2. check if it PPSTed current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong.', 404));
  }

  // 3. if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdandUpdate non funziona come ci si aspetta, non fa partire i middlware e i validatori
  // 4. login the user again sending new JWT Token
  createAndSandToken(user, 200, res);
});
