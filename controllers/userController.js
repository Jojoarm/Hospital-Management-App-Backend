import validator from 'validator';
import bcrypt from 'bcrypt';
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

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

export { createUser, loginUser, getUser, updateUser };
