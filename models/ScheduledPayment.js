const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
 
  title: { type: String, required: true },

  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true }
}, { _id: false });

const ScheduledPaymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  mobileNumber: {
    type: String,
    required: true
  },
  mobileNumberChecked: {
    type: Boolean,
    required: true
  },
  cartItems: {
    type: [CartItemSchema],
    required: true
  },
  payLaterCharge:{
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ScheduledPayment', ScheduledPaymentSchema);
