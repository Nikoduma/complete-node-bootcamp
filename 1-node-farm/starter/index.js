// Lettura file in modo bloccante sincrono
const fs = require('fs');
const textIn = fs.readFileSync('./txt/input.txt', 'utf-8');
console.log(textIn);
const textOut = `${textIn}, and everyone is happy! 💕😁\nCreated on ${Date.now()}`;
fs.writeFileSync('./txtoutput.txt', textOut);
console.log('File Written!');

// Lettura file in modo NON bloccante asincrono
fs.readFile('./txt/start.txt', 'utf-8', (err, data1) => {
  if (err) return console.log('ERRORE! 🧨');

  fs.readFile(`./txt/${data1}.txt`, 'utf-8', (err, data2) => {
    console.log(data2);
    fs.readFile(`./txt/append.txt`, 'utf-8', (err, data3) => {
      console.log(data3);

      fs.writeFile('./txt/final.txt', `${data2}\n${data3}`, 'utf-8', err => {
        // ha un solo parametro ed è l'errore
        console.log('File scritto!');
      });
    });
  });
});
