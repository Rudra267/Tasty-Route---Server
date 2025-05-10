const mongoose = require('mongoose');

// Define schema for dishes
const dishSchema = new mongoose.Schema({
    dish: String,
    image:String,
    price: Number,
    rating: Number
});

// Define schema for restaurant
const restaurantSchema = new mongoose.Schema({
    name: String,
    location: String,
    image:String,
    distance: String,
    opening_time: String,
    closing_time: String,
    rating: Number,
    menus: {
        breakfast: [dishSchema],
        lunch: [dishSchema],
        dinner: [dishSchema]
    }
});

// Define Restaurant model
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
