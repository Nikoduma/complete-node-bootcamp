const mongoose = require('mongoose'); // per usare MongoDB
const fs = require('fs');
const Tour = require('./../../models/tourModel');
const dotenv = require('dotenv');
const { exit } = require('process');

dotenv.config({ path: './../../config.env' }); // leggo il file di configurazione qui ed entra nel processo, per cui sarà visibile in tutti i files.

// 2. Configuro e apro il db

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// mongoose è una promise
// posso usarla così per le mie connessioni
mongoose
  .connect(DB, {
    useNewUrlParcer: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log('connessione stabilita!');
  });

// leggo il file

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
);

//cancella tutto dla database
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Dati cancellati correttamente.');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

// insert data in DB
const importData = async () => {
  try {
    await Tour.create(tours); // accetta un array e crea i documenti.
    console.log('Dati caricati correttamente.');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

//console.log(process.argv);

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
