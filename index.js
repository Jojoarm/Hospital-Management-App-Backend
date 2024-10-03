// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();
// const mongoose = require('mongoose');

//import will work since we are using type module in package.json
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import 'dotenv/config';
import connectCloudinary from './config/cloudinary.js';
import adminRouter from './routes/adminRoutes.js';

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log('Connected to DB'));

const app = express();
const port = process.env.PORT || 5000;

connectCloudinary();

//middlewares
app.use(express.json());
app.use(cors());

//api endpoints
app.use('/api/admin', adminRouter);

app.listen(port, () => {
  console.log('Server started');
});
