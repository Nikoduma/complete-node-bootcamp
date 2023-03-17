const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

// OPEN ROUTES
// => signup Segue un metodo leggermente diverso infatti come si può vedere qui sotto non uso .route('/signup'), Ma uso direttamente post con parametro L'indirizzo a cui uno può fare il sign up. Anche perché non possiamo applicare get o delete o patch a sign up ma soltanto mandare dati per creare un nuovo utente.
router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword); // Devo fare il patch della password quindi devo modificare il documento

// PROTECTED ROUTES
// dato che 'router' è una sorta di mini applicazione e dato che i middleware sono eseguiti in sequenza nel file, mi basta indicare da questo punto in poi che è necessario usare un authController.protect, lo faccio con 'use'

router.use(authController.protect); // <<<===  questa riga protegge tutto quello che viene dopo in questo file

router.patch('/updateMyPassword/', authController.updatePassword);
router.patch('/updateMe/', userController.updateMe);
router.delete('/deleteMe/', userController.deleteMe); // anche se non cacelliamo veramente niere dal db, ma modifico il valore active a false dell'utente, uso delete invece di patch nella chiamata html
router.get('/me', userController.getMe, userController.getOneUser);

// protect all the routes below to be handled only from an Admin
router.use(authController.restictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getOneUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
