// 1. carico il file config
const mongoose = require('mongoose'); // per usare MongoDB
const dotenv = require('dotenv');

//Gestisco le eccezioni, creo l'event handler prima di tutto il codice
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 🧨 Server is shutting down...');
  console.error(err.name, err.message);
  process.exit(1); // 1 sta per Unhandled Promise Rejection; 0 se tutto va bene.
});

dotenv.config({ path: './config.env' }); // leggo il file di configurazione qui ed entra nel processo, per cui sarà visibile in tutti i files.
const app = require('./app');

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
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('connessione stabilita!');
  })
  .catch(err => console.log('Could not connect', err));

// console.log(app.get('env')); //  ritorna l'ambiente in cui siamo adesso => development
// console.log(process.env); // ritorna gli ambienti impostati da Node.js

// Server
const port = process.env.PORT || 3000; // Uso config
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
});

// Qui gestisco i le funzioni asincrone e le promise
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 🧨 Server is shutting down...');
  console.error(err.name, err.message);
  // Chiudo il server con close e solo quando è chiuso lancia la funzione in cui chiudo il processo
  server.close(() => {
    process.exit(1); // 1 sta per Unhandled Promise Rejection; 0 se tutto va bene.
  });
});
