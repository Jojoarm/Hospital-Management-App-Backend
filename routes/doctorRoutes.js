import express from 'express';
import {
  appointmentCancel,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  getDoctorAppointments,
  getDoctorList,
  loginDoctor,
  updateDoctorProfile,
} from '../controllers/doctorController.js';
import authDoctor from '../middlewares/authDoctor.js';

const doctorRouter = express.Router();

doctorRouter.get('/list', getDoctorList);
doctorRouter.post('/login', loginDoctor);
doctorRouter.get('/appointments', authDoctor, getDoctorAppointments);
doctorRouter.post('/complete-appointment', authDoctor, appointmentComplete);
doctorRouter.post('/cancel-appointment', authDoctor, appointmentCancel);
doctorRouter.get('/dashboard', authDoctor, doctorDashboard);
doctorRouter.get('/profile', authDoctor, doctorProfile);
doctorRouter.post('/update-profile', authDoctor, updateDoctorProfile);

export default doctorRouter;
