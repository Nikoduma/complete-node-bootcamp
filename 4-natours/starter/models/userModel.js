const crypto = require('crypto');
const mongoose = require('mongoose'); // per usare MongoDB
const validator = require('validator');
const bcrypt = require('bcryptjs');

// 1. creo lo schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name'], // se metto true, posso farlo con un array con l'errore di validazione
      trim: true, // leva gli Spazi bianchi all'inizio e alla fine
      maxlength: [40, 'A name must be long no more than 40 characters'],
      minlength: [1, 'A name must be long at least 1 characters']
    },
    email: {
      type: String,
      required: [true, 'A user must have an email'], // se metto true, posso farlo con un array con l'errore di validazione
      unique: true,
      trim: true, // leva gli Spazi bianchi all'inizio e alla fine
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email.'] //Lo elimino perché non considera gli spazi come caratteri e quindi da errore
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user'
    },
    password: {
      type: String,
      required: [true, 'Please enter a password!'],
      minlength: [8, 'A password must be long at least 8 characters'],
      select: false // non lo mostra mai nelle query, non lo manda mai al client
    },
    // Questo campo di richiesta riconferma avrà esclusivamente la funzione di validazione della password, perché poi non sarà salvato. Non abbiamo impostato come required solo per fare la validazione
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password!'],
      // Questa validazione funziona soltanto in fase di CREATE e SAVE, Se invece aggiorniamo non funziona
      validate: {
        validator: function(passConf) {
          return passConf === this.password; // deve tornare true o false
        },
        message: 'The two passwords are not the same'
      }
    },
    photo: [String], // un array di stringhe
    createdAt: {
      type: Date,
      default: Date.now,
      select: false // non lo mostra mai nelle query, non lo manda mai al client
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpire: Date
  },
  {
    // Specifico qui i parametri dello schema sono fuori dallo schema stesso, come secondo oggetto nella definizione dello schema appunto. Adesso specifico che ogni volta che si effettua l'estrazione sia in JSON sia in oggetto dello schema,le chiavi virtuali compaiono appunto
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// 1.1 Virtual properties
// userSchema.virtual('durationWeeks').get(function() {});

// 1.2 Document middleware: Vengono lanciati prima .save() e .create() => invece .insertMany() Non scatena il middleware Basato su Save
// Qui lo utilizziamo per criptare la password prima che venga salvata: PASSWORD ENCRYPTION

userSchema.pre('save', async function(next) {
  //Uso un metodo di mongoose per verificare che effettivamente il campo password è stato modificato, altrimenti non lo tocco
  if (!this.isModified('password')) return next();

  // Facciamo l'hash della password con costo 12
  this.password = await bcrypt.hash(this.password, 13);

  // Cancello la password di conferma
  this.passwordConfirm = undefined;
});

userSchema.pre('save', async function(next) {
  // Verifico che Sia stata effettivamente modificata la password oppure che questo documento non sia uno nuovo per prima di eseguire le operazioni seguenti.
  if (!this.isModified('password') || this.isNew) return next();

  // Può succedere che il cambio della password avvenga con un piccolo ritardo virgola e quindi la funzione sottostante Può creare problemi in caso di verifica della validità del JWT In funzione proprio del cambio password.Per evitare questo problema sottraiamo un secondo al tempo, mettiamo cioè la data del cambio della password un secondo nel passato. Non è un metodo totalmente accurato però funziona. In questo modo ci assicuriamo che il token viene sempre creato dopo che la password è stata cambiata

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// Instance Methods - Metodi disponibili nelle ISTANZE di questo oggetto
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  // Visto che chi chiama questa funzione è un documento, in teoria nella variabile this la password è presente. Abbiamo però messo nello schema la password nascosta, il che significa che nell'output non esisterà e non posso usare la chiave this. Ecco perché invece la passo come parametro.

  // Usiamo la funzione compare che ritorna vero o falso.
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function(JWTTimestamp) {
  // Quando chiamo questo metodo ho accesso alla chiave this, E questa punta al documento utente per cui Se esiste la chiave che definisce il cambio della password entro nell'if, altrimenti no.

  if (this.passwordChangedAt) {
    const changeTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return changeTimestamp > JWTTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  // si crea un token che è una password temporanea
  const resetToken = crypto.randomBytes(32).toString('hex');

  // crittiamo la password temporanea
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpire = Date.now() + 10 * 60 * 1000; // 10 miuti poi scade

  return resetToken;
};

// userSchema.pre(/^find/, function(next) {
//   //this punta alla query
//   this.find({ secretTours: { $ne: true } });
//   this.start = Date.now(); // È un oggetto come un'altro e posso aggiungere chiavi e proprietà
//   next();
// });

// userSchema.post(/^find/, function(docs, next) {
//   console.log(`the query tooks ${Date.now() - this.start} milliseconds.`);
//   next();
// });

// 2. creo il modello dallo schema => i modello hanno la prima lettera maiuscola.
const User = mongoose.model('User', userSchema);

//3. esporto
module.exports = User;
