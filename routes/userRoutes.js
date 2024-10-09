import express from 'express';
import {
  bookAppointment,
  cancelAppointment,
  createUser,
  getAppointments,
  getUser,
  loginUser,
  stripePayment,
  updateUser,
} from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';
import upload from '../middlewares/multer.js';

const userRouter = express.Router();

userRouter.post('/create-user', createUser);
userRouter.post('/login', loginUser);
userRouter.get('/user-profile', authUser, getUser);
userRouter.post(
  '/update-profile',
  upload.single('image'),
  authUser,
  updateUser
);
userRouter.post('/book-appointment', authUser, bookAppointment);
userRouter.get('/appointments', authUser, getAppointments);
userRouter.post('/cancel-appointment', authUser, cancelAppointment);
userRouter.post('/payment', authUser, stripePayment);

export default userRouter;
