// FUNZIONE PER CATTURARE TUTTI GLI ERRORI DELLE FUNZIONI ASINCRONE
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
