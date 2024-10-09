import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true },
  userId: { type: String, required: true },
  userData: { type: Object, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const orderModel = mongoose.model('order', orderSchema);

export default orderModel;
