const fs = require('fs');
const server = require('http').createServer(); // faccio tutto in uno

server.on('request', (req, res) => {
  // Soluzone 1 ----------------------------------------------
  /*   fs.readFile('test-file.txt', (err, data) => {
    if (err) console.err(err);
    res.end(data); // scrivo su response data e chiudo.
  }); */

  // Soluzone 2 ----------------------------------------------
  /*   const stream = fs.createReadStream('test-file.txt');
  stream.on('data', chunk => {
    res.write(chunk);
  });
  // ascolto l'evetnto di fine file e scrivo su response .end()
  stream.on('end', () => {
    res.end();
  });

  // Gestisco l'errore
  stream.on('error', err => {
    console.log(`${err} File not found`);
    res.statusCode = 500;
    res.end('File not found');
  }); */

  // Soluzone 3 ----------------------------------------------
  const stream = fs.createReadStream('test-file.txt');
  stream.pipe(res);
  // => readableSource.pipe(WritableDestination)
});

server.listen(8000, '127.0.0.1', () => {
  console.log('listening...');
});
