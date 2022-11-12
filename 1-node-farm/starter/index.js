// Lettura file in modo bloccante sincrono
const fs = require('fs');
const http = require('http');
const url = require('url');

////////////////////////////////////
// FILES read and write
/* 

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
 */

////////////////////////////////////
// SERVER

// fs.readFile(`${__dirname}/dev-data/data.json`, 'utf-8', (err, data) => {
//   const productData = JSON.parse(data);
// });
//==> uso la versone sincrona perché è più semplice e mette i dati un una variable. Se è bloccante, accade slo all'iniizo e il testo è corto, inoltre viene eseguito una sola volta, mentre le richieste sotto sono eseguire ogni volta
// le funzoni

const replaceTemplate = (template, product) => {
  let output = template.replaceAll(`{%PRODUCTNAME%}`, product.productName); // uso le regular expression per sostituire tutte le occorrenze
  output = output.replaceAll(`{%IMAGE%}`, product.image);
  output = output.replaceAll(`{%QUANTITY%}`, product.quantity);
  output = output.replaceAll(`{%PRICE%}`, product.price);
  output = output.replaceAll(`{%ID%}`, product.id);
  output = output.replaceAll(`{%DESCRIPTION%}`, product.description);
  output = output.replaceAll(`{%FROM%}`, product.from);
  output = output.replaceAll(`{%NUTRIENTS%}`, product.nutrients);

  output = !product.organic
    ? output.replace('{%NOT_ORGANIC%}', 'not-organic')
    : output;
  return output;
};

// 0. Leggo i dati fuori dalla callback di createserver perché non cambiano e in questo modo vengono letti una sola volta
const templateOvervew = fs.readFileSync(
  `${__dirname}/templates/template-overview.html`,
  'utf-8'
);
const templateProduct = fs.readFileSync(
  `${__dirname}/templates/template-product.html`,
  'utf-8'
);
const templateCard = fs.readFileSync(
  `${__dirname}/templates/template-card.html`,
  'utf-8'
);
const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8');
const dataObject = JSON.parse(data);

// 1. Creazione del server
// risponde e si attiva ogni volta che si verifica l'evento
const server = http.createServer((request, response) => {
  //Routing

  const pathName = request.url; // viene dal modulo url
  // OVERVIEW
  if (pathName === '/' || pathName === '/overview') {
    response.writeHead(200, {
      'Content-type': 'text/html', // Per HTML
    });

    let cardsHTML = dataObject
      .map(el => replaceTemplate(templateCard, el))
      .join('');

    let output = templateOvervew.replace('{%PRODUCT_CARDS%}', cardsHTML);

    response.end(output);

    //PRODUCT PAGE
  } else if (pathName === '/product') {
    response.end('You are in PRODUCT');

    // API
  } else if (pathName === '/api') {
    response.writeHead(200, {
      'Content-type': 'application/json', // Per HTML
    });
    response.end(data);

    // NOT FOUND
  } else {
    response.writeHead(404, {
      'Content-type': 'text/html', // Per HTML
      'my-own-header': 'Hi Nico',
    });
    response.end('<h1>Page not found!</h1>');
  }
});

// 2. Ascoltare il server
server.listen(8000, '127.0.0.1', () => {
  console.log('Listening to requests on port 8000');
}); // porta, indirizzo server => è un default in localhost, se non esplicito è sempre localhost
