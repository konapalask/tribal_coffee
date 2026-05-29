import mongoose from 'mongoose';

// 1. User Schema
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  salt: { type: String }, // Optional OpenCart password salt
  role: { type: String, required: true, default: 'Connoisseur' },
  address: { type: mongoose.Schema.Types.Mixed }, // Mixed type supporting custom JSON objects or address strings
  phone: { type: String } // Customer contact number
}, { timestamps: true });

// 2. Product Schema
const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true, enum: ['beans', 'powder', 'specialty', 'filter'] },
  tagline: { type: String, required: true },
  roast: { type: String, required: true },
  roastLevel: { type: Number, required: true },
  strength: { type: Number, required: true },
  acidity: { type: Number, required: true },
  body: { type: Number, required: true },
  chicory: { type: String, required: true },
  tastingNotes: { type: [String], required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String, required: true },
  description: { type: String, required: true },
  aromaDescription: { type: String, required: true },
  bgGradient: { type: String, required: true },
  glowColor: { type: String, required: true }
}, { timestamps: true });

// 3. Booking Item Sub-Schema
const BookingItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
}, { _id: false });

// 4. Booking Schema (representing Order histories)
const BookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  customerName: { type: String, required: true },
  city: { type: String },
  pincode: { type: String },
  items: { type: [BookingItemSchema], required: true },
  amount: { type: Number, required: true },
  status: { type: String }, // e.g. "Pending", "Dispatched"
  courier: { type: String },
  awb: { type: String }
}, { timestamps: true });

// Export Models
export const User = mongoose.model('User', UserSchema);
export const Product = mongoose.model('Product', ProductSchema);
export const Booking = mongoose.model('Booking', BookingSchema);
