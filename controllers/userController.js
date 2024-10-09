import validator from 'validator';
import bcrypt from 'bcrypt';
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import Stripe from 'stripe';
import orderModel from '../models/orderModel.js';

const STRIPE = new Stripe(process.env.STRIPE_API_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL;

//api to register user
const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    //validations
    if (!name || !password || !email) {
      return res.json({ success: false, message: 'Missing Details' });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: 'Enter valid email' });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: 'Enter a stronger password' });
    }

    //hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = { name, email, password: hashedPassword };

    const user = new userModel(userData);
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    return res.json({
      success: true,
      message: 'User added successfully',
      data: user,
      token,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//api for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: 'User does not exist' });
    }

    //verify user password
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      return res.json({
        success: true,
        message: 'User fetched successfully',
        data: user,
        token,
      });
    } else {
      return res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//api to get user
const getUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select('-password');
    res.json({
      success: true,
      message: 'User fetched successfully',
      userData,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//update user
const updateUser = async (req, res) => {
  try {
    const { userId, name, tel, address, dob, gender } = req.body;
    const imageFile = req.file;
    if (!name || !tel || !address || !dob || !gender) {
      return res.json({ success: false, message: 'Data missing' });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      tel,
      address: JSON.parse(address),
      dob,
      gender,
    });

    //if new image
    if (imageFile) {
      //upload to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: 'image',
      });
      const imageUrl = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageUrl });
    }
    return res.json({ success: true, message: 'User profile updated' });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//Api to book appointment
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;
    const docData = await doctorModel.findById(docId).select('-password');

    if (!docData.available) {
      return res.json({ success: false, message: 'Doctor not available' });
    }

    let slots_booked = docData.slots_booked;

    // checking for slots availability
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: 'Slot not available' });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    const userData = await userModel.findById(userId).select('-password');

    // delete booked slot from doc data
    delete docData.slots_booked;

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    //save new slots data in docData
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({
      success: true,
      message: 'Appointment booked!',
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//api to get user appointments
const getAppointments = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });

    res.json({
      success: true,
      message: 'Appointments for user fetched successfully',
      appointments,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//api to cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    //verify user
    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: 'Unauthorized action' });
    }
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    //removing slot from doctors slot
    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);
    let slots_booked = doctorData.slots_booked;
    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (time) => time !== slotTime
    );
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    res.json({
      success: true,
      message: 'Appointment cancelled',
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//api to make payment using stripe
const stripePayment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const userData = await userModel.findById(userId).select('-password');
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.json({ success: false, message: 'Cannot process payment' });
    }

    const orderData = {
      userId,
      userData,
      appointmentId,
      amount: appointment.amount,
    };

    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: appointment.docData.name,
          },
          unit_amount: Math.round(appointment.amount * 100),
        },
        quantity: 1,
      },
    ];
    const session = await STRIPE.checkout.sessions.create({
      line_items: lineItems,
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/my-appointments`,
      cancel_url: `${FRONTEND_URL}/doctors`,
    });

    if (!session.url) {
      return res.status(500).json({ message: 'Error creating stripe session' });
    }

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });

    return res.json({
      success: true,
      message: 'Appointment booked!',
      url: session.url,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

export {
  createUser,
  loginUser,
  getUser,
  updateUser,
  bookAppointment,
  getAppointments,
  cancelAppointment,
  stripePayment,
};
