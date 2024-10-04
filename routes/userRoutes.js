import express from 'express';
import {
  createUser,
  getUser,
  loginUser,
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

export default userRouter;
