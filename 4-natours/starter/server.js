// 1. carico il file config
const mongoose = require('mongoose'); // per usare MongoDB
const dotenv = require('dotenv');
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
    useFindAndModify: false
  })
  .then(() => {
    console.log('connessione stabilita!');
  });

// console.log(app.get('env')); //  ritorna l'ambiente in cui siamo adesso => development
// console.log(process.env); // ritorna gli ambienti impostati da Node.js

// Server
const port = process.env.PORT || 3000; // Uso config
app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
});
