const app = require('./app');

// Server
const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
});
