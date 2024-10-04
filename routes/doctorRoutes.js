import express from 'express';
import { getDoctorList } from '../controllers/doctorController.js';

const doctorRouter = express.Router();

doctorRouter.get('/list', getDoctorList);

export default doctorRouter;
