const express = require('express');

const app = express();

// Routing con GET
app.get('/', (req, res) => {
  // res.status(200).send('Ciao dal server!');
  res.status(200).json({ message: 'Ciao dal Server!', app: 'Natours' });
});

// Routing con POST
app.post('/', (req, res) => {
  res.send('Puoi postare su questo endpoint!...');
});

// faccio partire un server web in ascolto
// non ho più bisogno di richidere http, creare il server con la callback e poi mettermi in ascolto del server per un evento.

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
});
