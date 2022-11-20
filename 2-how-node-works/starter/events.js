const EventEmitter = require('events'); // questa è una classe, server ne è una istanza.
const http = require('http');

class Sales extends EventEmitter {
  constructor() {
    super();
  }
}

const myEmitter = new Sales();

myEmitter.on('newSale', () => {
  console.log("C'è stata una vendita!");
});

// posso mettere più listener per un singolo evento, verranno eseguiti in modo sincrono in sequenza
myEmitter.on('newSale', () => {
  console.log('Acquirente Nico.');
});

// posso passare parametri
myEmitter.on('newSale', quanti => {
  console.log(`Comprati ${quanti} pezzi.`);
});

myEmitter.emit('newSale', 9); // emetto, genero l'evento, può prendere parametri

////////////////

const server = http.createServer(); // è una istanza di EventEmitter

server.on('request', (req, res) => {
  console.log('Request received!');
  res.end('Richiesta Ricdevuta!');
});

server.on('request', (req, res) => {
  console.log("Un'altra richiesta 😁");
});

server.on('close', (req, res) => {
  console.log('Server Closed');
});

server.listen(8000, '127.0.0.1', () => {
  console.log('Aspetto richiesta....');
});
