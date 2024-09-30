const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log('Connected to DB'));

const app = express();
app.use(cors);

app.listen(5000, () => {
  console.log('Server started');
});
