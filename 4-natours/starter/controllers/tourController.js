const fs = require('fs');
const Tour = require('./../models/tourModel');

// ALIASES
exports.aliasTopTour = (req, res, next) => {
  //preimposto l'url della query. sonontutte stringhe
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,-price';
  req.query.fields = 'name,price,ratingsAverage,difficulty';
  next();
};

// METODI
exports.getAllTours = async (req, res) => {
  try {
    // 1. Costruiamo la query: FILTERING
    const queryObject = { ...req.query };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach(el => delete queryObject[el]); // cancella dalla copia Della query proveniente dal browser le chiavi che non sono strettamente incluse nel documento della collezione, nello schema del db.

    // 1.1 Costruiamo la query: FILTERING AVANZATO
    // i Filtri si fanno inserendo il simbolo del dollaroprima della stringa: Per esempio greater than equal è $gte, Ma nella stringa query che arriva dal browser posso solo scrivere gte Tra parentesi graffe.
    //Voglio sostituire:gt gte, lt, lte
    // per farlo uso le Regular Expressions
    let queryString = JSON.stringify(queryObject);
    queryString = queryString.replace(
      /\b(gt|gte|lt|lte)\b/g,
      match => `$${match}`
    );

    // console.log(JSON.parse(queryString));
    let query = Tour.find(JSON.parse(queryString)); // Ritorna una query su cui posso fare l'incatenamento di altri metodi

    // 2. Ordinamento: SORTING
    // il parametro Della ricerca compare come proprietà della stringa rec.query
    if (req.query.sort) {
      // query.sort('-chiave1 chiave2') Ordina prima per chiave (campo) uno, poi per chiave due, insegno davanti alla chiave impone l'andamento dell'ordinamento
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // 3. LIMITING THE RESULT FIELDS
    if (req.query.fields) {
      // query.select('campo1 campo2...')  Seleziona e mostra solo quei campi
      const fieldsSelect = req.query.fields.split(',').join(' ');
      query = query.select(fieldsSelect); // stiamo facendo quello che si chiama projecting.
    } else {
      query = query.select('-__v'); // Con il simbolo del meno vado ad escludere i campi che non voglio vedere virgola in particolare il campo in questo caso è un campo di controllo di mongoDB, Il sistema lo mette sempre qui Lo escludiamo dalla visualizzazione e selezione
    }

    // 4. PAGINAZIONE

    // Devo anche creare un default per evitare di mostrare infiniti risultati. Metto pagina 1, la prima.
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 100;
    const skip = (page - 1) * limit; // Se voglio vedere i risultati della pagina tremi serve due per limit.Cosi da saltare un numero di risultati equivalenti a due pagine

    if (req.query.page) {
      const numTours = await Tour.countDocuments();
      if (skip >= numTours) throw new Error('This page does not exist');
    }

    // lo skip Salta un certo numero di risultati, quindi di documenti.Dobbiamo trovare un sistema per calcolare un valore skip per fare in modo che nella pagina ci siano soltanto appunto 10 risultati come indicato in limit.
    // Se skip è uguale a 10 significa che vedrò come risultato, i documenti da 11 20, In quanto i risultati da uno a 10 vengono saltati
    query = query.skip(skip).limit(limit);

    // ---------------------------------------
    // console.log(req.query, queryObject);

    // dato che  req.query={duration: 5, difficulty: 'easy' }
    // const tours = await Tour.find(req.query);

    // const tours = await Tour.find({
    //   duration: 5,
    //   difficulty: 'easy'
    // });

    //mongoose way => Posso anche usarealtri metodi tipo minore .lt(), .lte() o uguale maggiore o uguale e via, ordinamenti
    // const tours = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');
    // ---------------------------------------

    // console.log(query, req.query, queryObject);

    // 2. Eseguiamo la query
    const tours = await query;

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { tours }
    });
  } catch (error) {
    res.status(404).json({
      status: 'Fail',
      message: error
    });
  }
};

// // Creo una funzione da usare in un middlware per validare l'ID, invece di validarlo in più parti del codice.
// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);
//   // if (+req.params.id > tours.length) {
//   //   return res.status(404).json({
//   //     status: 'Fail',
//   //     message: 'Invalid Id.'
//   //   });
//   // }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'Fail',
//       message: 'Invalid Body.'
//     });
//   }
//   next();
// };

exports.getOneTour = async (req, res) => {
  try {
    // const tour = tours.find(el => el.id === id);

    const tour = await Tour.findById(req.params.id);
    // Tour.findOne({_id: req.params.id}) specifichiamo Un oggetto filtro in cui usiamo una chiave ed un valore che vogliamo cercare

    res.status(200).json({
      status: 'success',
      data: { tour }
    });
  } catch (error) {
    res.status(404).json({
      status: 'Fail',
      message: error
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    // prima era così, inoltre adesso usiami async await
    // const testTour = new Tour({...});
    // testTour.save()

    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { tour: newTour }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error
    });
  }
};

// modifico il tour => modifico solo quello che devo modificare.
exports.updateTour = async (req, res) => {
  try {
    // passo new:true come parametro => Fa tornareil nuovo documento appena aggiornato in modo da poterlo stampare. L'oggettonel.be modificato ma lui torna un'altro ne torna una copia in modo da poterla poi indicarenella stampa
    //Uso anche runvalidators per lanciare i meccanismi di varietà azione dei dati un'altra volta
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour: tour
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'Fail',
      message: error
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: {
        message: 'Deleted'
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'Fail',
      message: error
    });
  }
};
