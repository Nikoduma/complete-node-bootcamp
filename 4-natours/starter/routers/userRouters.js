const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

// => signup Segue un metodo leggermente diverso infatti come si può vedere qui sotto non uso .route('/signup'), Ma uso direttamente post con parametro L'indirizzo a cui uno può fare il sign up. Anche perché non possiamo applicare get o delete o patch a sign up ma soltanto mandare dati per creare un nuovo utente.
router.post('/signup', authController.signUp);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword); // Devo fare il patch della password quindi devo modificare il documento
router.patch(
  '/updateMyPassword/',
  authController.protect,
  authController.updatePassword
);

router
  .route('/')
  .get(authController.protect, userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getOneUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
