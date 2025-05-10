const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  completeAddress: { type: String, required: true },
  floor: String,
  nearBy: String,
  addressType: { type: String, required: true },
  addressTypeOther: String,
}, { timestamps: true });

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
