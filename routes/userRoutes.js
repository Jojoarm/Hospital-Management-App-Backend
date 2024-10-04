import express from 'express';
import {
  createUser,
  getUser,
  loginUser,
} from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';

const userRouter = express.Router();

userRouter.post('/create-user', createUser);
userRouter.post('/login', loginUser);
userRouter.get('/user-profile', authUser, getUser);

export default userRouter;
