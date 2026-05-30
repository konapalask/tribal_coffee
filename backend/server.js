import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(bodyParser.json());

// Serve static assets (media, product images) from public/ directory
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE_PATH = path.join(__dirname, 'data', 'products.json');
const USERS_FILE_PATH = path.join(__dirname, 'data', 'users.json');
const SPAM_USERS_FILE_PATH = path.join(__dirname, 'data', 'spam_users.json');
const BOOKINGS_FILE_PATH = path.join(__dirname, 'data', 'bookings.json');
const DELIVERY_PROVIDERS_FILE_PATH = path.join(__dirname, 'data', 'delivery_providers.json');

// --- OTP Setup ---
const otpStore = new Map();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'samuelnikhil147@gmail.com', // User's Gmail
    pass: process.env.EMAIL_PASS || 'nikhilbahubali@qwe'         // User's App Password
  }
});
// -----------------

// --- Helper functions for JSON database operations ---
function readJSONFile(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJSONFile(filePath, data) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// --- Multi-Hash Password Verification Helpers ---
function verifyWordPressPassword(password, hash) {
  if (!hash.startsWith('$P$') && !hash.startsWith('$H$')) return false;
  
  const itoa64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const countLog2 = itoa64.indexOf(hash[3]);
  if (countLog2 < 7 || countLog2 > 30) return false;
  
  const count = 1 << countLog2;
  const salt = hash.substring(4, 12);
  
  let currentHash = crypto.createHash('md5').update(salt + password).digest();
  for (let i = 0; i < count; i++) {
    currentHash = crypto.createHash('md5').update(Buffer.concat([currentHash, Buffer.from(password)])).digest();
  }
  
  function encode64(input, count) {
    let output = '';
    let i = 0;
    while (i < count) {
      let value = input[i++];
      output += itoa64[value & 0x3f];
      if (i < count) value |= input[i] << 8;
      output += itoa64[(value >> 6) & 0x3f];
      if (i >= count) break;
      i++;
      if (i < count) value |= input[i] << 16;
      output += itoa64[(value >> 12) & 0x3f];
      if (i >= count) break;
      i++;
      output += itoa64[(value >> 18) & 0x3f];
    }
    return output;
  }
  
  const encodedHash = hash.substring(0, 12) + encode64(currentHash, currentHash.length);
  return encodedHash === hash;
}

function verifyOpenCartPassword(password, hash, salt) {
  if (!salt) return false;
  const hash1 = crypto.createHash('sha1').update(password).digest('hex');
  const hash2 = crypto.createHash('sha1').update(salt + hash1).digest('hex');
  const hash3 = crypto.createHash('sha1').update(salt + hash2).digest('hex');
  if (hash3 === hash) return true;

  const altHash2 = crypto.createHash('sha1').update(salt + hash1).digest('hex');
  if (altHash2 === hash) return true;

  const sha1Plain = crypto.createHash('sha1').update(password).digest('hex');
  if (sha1Plain === hash) return true;

  const sha1Salt = crypto.createHash('sha1').update(salt + password).digest('hex');
  if (sha1Salt === hash) return true;

  return false;
}

function verifyPassword(inputPassword, storedPassword, salt) {
  if (!storedPassword) return false;
  if (inputPassword === storedPassword) return true;

  if (storedPassword.startsWith('$P$') || storedPassword.startsWith('$H$')) {
    return verifyWordPressPassword(inputPassword, storedPassword);
  }

  if (storedPassword.length === 40 && /^[0-9a-fA-F]+$/.test(storedPassword)) {
    return verifyOpenCartPassword(inputPassword, storedPassword, salt);
  }

  return false;
}

// DEFAULT PRODUCTS SEED DATA FOR FACTORY RESET & SEEDING
const DEFAULT_PRODUCTS = [
  {
    "id": "just-arabica-beans",
    "name": "Just Arabica Coffee Beans",
    "category": "beans",
    "tagline": "100% ORGANIC ARAKU BEANS",
    "roast": "Medium-Dark Roast",
    "roastLevel": 4,
    "strength": 4,
    "acidity": 2,
    "body": 4,
    "chicory": "0% Chicory",
    "tastingNotes": ["Sweet Caramel", "Roasted Almond", "Mild Citrus", "Smoky Oak"],
    "price": 449,
    "price750g": 849,
    "size1Name": "350g",
    "size2Name": "750g",
    "originalPrice": 499,
    "image": "/images/Arabica Coffee Beans.webp",
    "description": "Certified organic, hand-selected Arabica whole beans grown at high altitudes of 1,200 meters by indigenous farmers in the volcanic soil of the Araku Valley. Roasted to medium-dark complexity in micro-batches to unleash an exceptionally low-acidity cup with a velvet, chocolatey finish.",
    "aromaDescription": "Intense and welcoming with sweet hints of brown sugar and warm toasted nuts, settling into a deep, earthy cacao bloom.",
    "bgGradient": "radial-gradient(circle at 50% 40%, rgba(43, 24, 16, 0.45) 0%, rgba(17, 17, 17, 1) 70%)",
    "glowColor": "rgba(74, 44, 29, 0.45)"
  },
  {
    "id": "just-arabica-fine-powder",
    "name": "Just Arabica Fine Ground Powder",
    "category": "powder",
    "tagline": "MICRO-BATCH ARABICA ESPRESSO GRIND",
    "roast": "Medium Roast",
    "roastLevel": 3,
    "strength": 3.5,
    "acidity": 3,
    "body": 3.5,
    "chicory": "0% Chicory",
    "tastingNotes": ["Cocoa Nibs", "Warm Nutmeg", "Floral Honey"],
    "price": 449,
    "price750g": 849,
    "size1Name": "350g",
    "size2Name": "750g",
    "image": "/images/Arabica Fine Ground Powder.webp",
    "description": "Freshly packed-to-order organic Arabica fine grinds, tailored specifically for high-pressure brewing methods like Espresso machines, Aeropress, or traditional stovetop Moka Pots. Offers a bright, balanced crema with intricate spice profiles.",
    "aromaDescription": "Bright floral top notes interwoven with a sweet, warming fragrance of natural nutmeg and wild mountain honey.",
    "bgGradient": "radial-gradient(circle at 50% 40%, rgba(74, 44, 29, 0.45) 0%, rgba(17, 17, 17, 1) 70%)",
    "glowColor": "rgba(154, 107, 66, 0.35)"
  },
  {
    "id": "just-arabica-coarse-powder",
    "name": "Just Arabica Coarse Ground Powder",
    "category": "powder",
    "tagline": "SLOW IMMERSION DEEP BREW",
    "roast": "Medium-Dark Roast",
    "roastLevel": 4,
    "strength": 4,
    "acidity": 2,
    "body": 4,
    "chicory": "0% Chicory",
    "tastingNotes": ["Dark Chocolate", "Smoked Mahogany", "Toasted Hazelnut"],
    "price": 449,
    "price750g": 849,
    "size1Name": "350g",
    "size2Name": "750g",
    "image": "/images/Arabica Coarse Ground Powder.webp",
    "description": "Organic Arabica beans ground to a coarse, uniform size to prevent over-extraction. Perfect for slow immersion coffee rituals including French Press, Cold Brew drippers, or siphon brewers. Brings out heavy-bodied cocoa depths.",
    "aromaDescription": "Robust, comforting woody aromas mixed with heavy dark cocoa solids and a whisper of slow smoky oak.",
    "bgGradient": "radial-gradient(circle at 50% 40%, rgba(60, 36, 25, 0.45) 0%, rgba(17, 17, 17, 1) 70%)",
    "glowColor": "rgba(200, 169, 126, 0.35)"
  },
  {
    "id": "south-indian-filter-coffee",
    "name": "South Indian Filter Coffee Powder",
    "category": "filter",
    "tagline": "60:40 ARABICA & CHICORY BLEND",
    "roast": "Dark Roast",
    "roastLevel": 5,
    "strength": 5,
    "acidity": 1,
    "body": 5,
    "chicory": "40% Chicory",
    "tastingNotes": ["Intense Cacao", "Chicory Sweetness", "Heavy Molasses"],
    "price": 299,
    "price750g": 549,
    "size1Name": "350g",
    "size2Name": "750g",
    "image": "/images/South Indian Filter Coffee Powder.webp",
    "description": "The definitive traditional South Indian filter coffee blend. Combining 60% high-altitude shade-grown Arabica and Robusta beans from Araku with 40% premium, slow-roasted French chicory. Delivers an incredibly thick, strong, and highly aromatic morning cup that pairs flawlessly with warm frothed milk.",
    "aromaDescription": "Pungent, highly concentrated and dark roasted with heavy caramel sugars, sweet malted chicory, and molasses.",
    "bgGradient": "radial-gradient(circle at 50% 40%, rgba(74, 50, 35, 0.45) 0%, rgba(17, 17, 17, 1) 70%)",
    "glowColor": "rgba(212, 140, 69, 0.4)"
  },
  {
    "id": "just-arabica-cold-brew",
    "name": "Just Arabica Cold Brew Concentrate",
    "category": "specialty",
    "tagline": "24-HOUR SLOW DRIPPED NECTAR",
    "roast": "Cold Steepted",
    "roastLevel": 3,
    "strength": 4,
    "acidity": 1,
    "body": 4,
    "chicory": "0% Chicory",
    "tastingNotes": ["Vanilla Pod", "Floral Jasmine", "Crisp Toffee"],
    "price": 399,
    "price750g": 749,
    "size1Name": "350g",
    "size2Name": "750g",
    "image": "/images/Arabica Cold Brew Concentrate.webp",
    "description": "Our signature cold-brewed nectar, slow-extracted over 24 hours in cold spring water from pure organic Araku Arabica beans. Yields an incredibly smooth, naturally sweet concentrate containing twice the caffeine kick of hot brew, with practically zero bitterness or acidity.",
    "aromaDescription": "Soft and delicate with undercurrents of fragrant night jasmine, vanilla bean pods, and light buttery toffee.",
    "bgGradient": "radial-gradient(circle at 50% 40%, rgba(83, 59, 40, 0.45) 0%, rgba(17, 17, 17, 1) 70%)",
    "glowColor": "rgba(154, 107, 66, 0.45)"
  }
];

// Initialize JSON files with seed data if they don't exist
const initializeJSONDatabase = () => {
  const users = readJSONFile(USERS_FILE_PATH, []);
  if (users.length === 0) {
    writeJSONFile(USERS_FILE_PATH, [
      {
        id: 'adm-1',
        name: 'Sharmila K',
        email: 'admin@tribalcoffee.in',
        password: 'password123',
        role: 'Super Admin'
      }
    ]);
  }

  const products = readJSONFile(DATA_FILE_PATH, []);
  if (products.length === 0) {
    writeJSONFile(DATA_FILE_PATH, DEFAULT_PRODUCTS);
  }

  readJSONFile(BOOKINGS_FILE_PATH, []);
  console.log('>>> Local JSON Database initialized successfully!');
};

initializeJSONDatabase();

// ----------------- API ROUTES -----------------

// 1. Auth Endpoint: Admin & User Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  try {
    const emailLower = email.toLowerCase().trim();
    const users = readJSONFile(USERS_FILE_PATH);
    const user = users.find(u => u.email.toLowerCase().trim() === emailLower);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'This connoisseur profile does not exist. Please register first.'
      });
    }

    if (!verifyPassword(password, user.password, user.salt)) {
      return res.status(401).json({
        success: false,
        message: 'Authentication rejected. Invalid password credentials.'
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address
      },
      token: 'secure-token-tribal-lounge-2026'
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Login query execution failed' });
  }
});

// 1b. Auth Endpoint: User Registration
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, phone, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please complete all fields.' });
  }

  try {
    const emailLower = email.toLowerCase().trim();
    const users = readJSONFile(USERS_FILE_PATH);
    const userExists = users.some(u => u.email.toLowerCase().trim() === emailLower);

    if (userExists) {
      return res.status(409).json({ success: false, message: 'This email is not available.' });
    }

    const assignedRole = role || 'Connoisseur';
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email: emailLower,
      password, // In a robust app, we would hash this, but keeping it simplified/matching original logic
      role: assignedRole,
      phone: phone || null,
      address: address || null,
      emailVerified: false  // TODO: Set to true after Firebase email verification is integrated
    };
    
    users.push(newUser);
    writeJSONFile(USERS_FILE_PATH, users);

    res.status(201).json({
      success: true,
      requiresVerification: true,  // TODO: Firebase will handle actual email sending
      user: { name, email: emailLower, role: assignedRole, phone: newUser.phone, address: newUser.address, emailVerified: false }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Failed to record profile.' });
  }
});

// --- Custom Email OTP Endpoints for Hybrid Flow ---

app.post('/api/auth/send-otp', (req, res) => {
  const { email, type = 'register' } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Missing email.' });

  const emailLower = email.toLowerCase().trim();
  
  const users = readJSONFile(USERS_FILE_PATH);
  const existingUser = users.find(u => u.email.toLowerCase().trim() === emailLower);

  if (type === 'register' && existingUser) {
    return res.status(409).json({ success: false, message: 'This email is already registered. Please sign in instead.' });
  }

  if (type === 'reset' && !existingUser) {
    return res.status(404).json({ success: false, message: 'No account found with this email address.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  otpStore.set(emailLower, { otp, expiresAt });

  const mailOptions = {
    from: process.env.EMAIL_USER || 'samuelnikhil147@gmail.com',
    to: emailLower,
    subject: 'Tribal Coffee - Your Verification Code',
    text: `Your Tribal Coffee verification code is: ${otp}\n\nThis code expires in 5 minutes.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending OTP:', error);
      console.log(`[DEV MODE] OTP for ${emailLower} is ${otp}`);
      return res.status(200).json({ 
        success: true, 
        message: 'OTP sent (Dev mode: Check server console for code)',
        devOtp: otp 
      });
    } else {
      return res.status(200).json({ success: true, message: 'OTP sent successfully.' });
    }
  });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const emailLower = email.toLowerCase().trim();
  const storedOtpData = otpStore.get(emailLower);

  if (!storedOtpData || Date.now() > storedOtpData.expiresAt) {
    if (storedOtpData) otpStore.delete(emailLower);
    return res.status(400).json({ success: false, message: 'OTP expired or not requested.' });
  }

  if (storedOtpData.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
  }

  otpStore.delete(emailLower);
  return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  const emailLower = email.toLowerCase().trim();
  const storedOtpData = otpStore.get(emailLower);

  if (!storedOtpData || Date.now() > storedOtpData.expiresAt || storedOtpData.otp !== otp) {
    if (storedOtpData && Date.now() > storedOtpData.expiresAt) otpStore.delete(emailLower);
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
  }

  // OTP is valid
  otpStore.delete(emailLower);

  const users = readJSONFile(USERS_FILE_PATH);
  const userIndex = users.findIndex(u => u.email.toLowerCase().trim() === emailLower);

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found in database.' });
  }

  users[userIndex].password = newPassword;
  writeJSONFile(USERS_FILE_PATH, users);

  return res.status(200).json({ success: true, message: 'Password reset successfully. You can now sign in.' });
});

app.post('/api/auth/register-profile', (req, res) => {
  const { email, name, phone, address, password, dob, gender } = req.body;

  try {
    const emailLower = email.toLowerCase().trim();
    const users = readJSONFile(USERS_FILE_PATH);
    const existingUser = users.find(u => u.email.toLowerCase().trim() === emailLower);

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists in profile db.' });
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name: name || emailLower.split('@')[0],
      email: emailLower,
      password: password || null,
      role: 'Connoisseur',
      phone: phone || null,
      address: address || null,
      dob: dob || null,
      gender: gender || null,
      emailVerified: true
    };
    
    users.push(newUser);
    writeJSONFile(USERS_FILE_PATH, users);

    return res.status(201).json({
      success: true,
      user: newUser
    });
  } catch (err) {
    console.error('Register profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to save profile.' });
  }
});

app.post('/api/auth/get-profile', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });

  try {
    const emailLower = email.toLowerCase().trim();
    const users = readJSONFile(USERS_FILE_PATH);
    const user = users.find(u => u.email.toLowerCase().trim() === emailLower);

    if (user) {
      if (!user.emailVerified) {
        user.emailVerified = true;
        writeJSONFile(USERS_FILE_PATH, users);
      }
      return res.status(200).json({ success: true, user });
    }
    
    // If not found in our JSON but Firebase authenticated them, they might be an old user
    return res.status(404).json({ success: false, message: 'Profile not found' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// 1h. Revoke Admin / User Access
app.delete('/api/auth/users/:id', (req, res) => {
  const { id } = req.params;
  try {
    const users = readJSONFile(USERS_FILE_PATH);
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found in archives.' });
    }

    const user = users[userIndex];
    if (user.email.toLowerCase() === 'admin@tribalcoffee.in') {
      return res.status(403).json({ success: false, message: 'Cannot revoke core Super Admin privileges.' });
    }

    users.splice(userIndex, 1);
    writeJSONFile(USERS_FILE_PATH, users);

    res.json({ success: true, message: 'Administrative access or user account successfully revoked.' });
  } catch (err) {
    console.error('Revoke access error:', err);
    res.status(500).json({ success: false, message: 'Failed to revoke access from database.' });
  }
});

// 1c. Get Registered Users list for Admin
app.get('/api/auth/users', (req, res) => {
  try {
    const users = readJSONFile(USERS_FILE_PATH);
    res.json(users);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ success: false, message: 'Failed to query users' });
  }
});

// 1f. Update user profile name and address
app.put('/api/auth/users/update', (req, res) => {
  const { email, name, address } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  try {
    const emailLower = email.toLowerCase().trim();
    const users = readJSONFile(USERS_FILE_PATH);
    const user = users.find(u => u.email.toLowerCase().trim() === emailLower);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in archives.' });
    }

    if (name) user.name = name;
    if (address !== undefined) user.address = address;
    
    writeJSONFile(USERS_FILE_PATH, users);

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (err) {
    console.error('Update user profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update user profile.' });
  }
});

// 1d. Create Booking/Order History
app.post('/api/bookings', (req, res) => {
  const booking = req.body;
  if (!booking.email || !booking.items) {
    return res.status(400).json({ success: false, message: 'Invalid booking data.' });
  }

  try {
    const bookings = readJSONFile(BOOKINGS_FILE_PATH);
    const newBooking = {
      id: `TRB-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString('en-IN'),
      email: booking.email.toLowerCase().trim(),
      customerName: booking.customerName || 'Connoisseur',
      city: booking.city,
      pincode: booking.pincode,
      items: booking.items,
      amount: booking.amount,
      status: booking.status || 'Pending',
      courier: booking.courier,
      awb: booking.awb
    };

    bookings.push(newBooking);
    writeJSONFile(BOOKINGS_FILE_PATH, bookings);

    res.status(201).json({ success: true, booking: newBooking });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ success: false, message: 'Failed to record booking history.' });
  }
});

// 1e. Get Booking History
app.get('/api/bookings', (req, res) => {
  try {
    const bookings = readJSONFile(BOOKINGS_FILE_PATH);
    res.json(bookings);
  } catch (err) {
    console.error('Fetch bookings error:', err);
    res.status(500).json({ success: false, message: 'Failed to load bookings' });
  }
});

// 1g. Update Booking status to Dispatched
app.put('/api/bookings/:id/dispatch', (req, res) => {
  const { id } = req.params;
  const { courier, awb } = req.body;

  try {
    const bookings = readJSONFile(BOOKINGS_FILE_PATH);
    const booking = bookings.find(b => b.id === id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    booking.status = 'Dispatched';
    booking.courier = courier || 'Delhivery Express';
    booking.awb = awb || `SR${Math.floor(10000000 + Math.random() * 90000000)}`;
    
    writeJSONFile(BOOKINGS_FILE_PATH, bookings);

    res.json({ success: true, booking });
  } catch (err) {
    console.error('Dispatch booking error:', err);
    res.status(500).json({ success: false, message: 'Failed to update dispatch status.' });
  }
});

// 2. Fetch all products
app.get('/api/products', (req, res) => {
  try {
    const products = readJSONFile(DATA_FILE_PATH);
    res.json(products);
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ success: false, message: 'Failed to query product inventory.' });
  }
});

// 3. Add a new product
app.post('/api/products', (req, res) => {
  const newProduct = req.body;
  
  if (!newProduct.id || !newProduct.name || !newProduct.price) {
    return res.status(400).json({ success: false, message: 'Invalid product specifications.' });
  }

  try {
    const products = readJSONFile(DATA_FILE_PATH);
    const existing = products.find(p => p.id === newProduct.id);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Product ID already exists in our archives.' });
    }

    products.push(newProduct);
    writeJSONFile(DATA_FILE_PATH, products);

    res.status(201).json({ success: true, products });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ success: false, message: 'Failed to write product.' });
  }
});

// 4. Update an existing product
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const updatedProduct = req.body;

  try {
    const products = readJSONFile(DATA_FILE_PATH);
    const product = products.find(p => p.id === id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found in our archives.' });
    }

    Object.assign(product, updatedProduct);
    product.id = id; // Keep ID invariant
    
    writeJSONFile(DATA_FILE_PATH, products);

    res.json({ success: true, products });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
});

// 5. Delete a product
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  try {
    const products = readJSONFile(DATA_FILE_PATH);
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: 'Product not found in our archives.' });
    }

    products.splice(productIndex, 1);
    writeJSONFile(DATA_FILE_PATH, products);

    res.json({ success: true, products });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

// 6. Reset database to default seed products
app.post('/api/products/reset', (req, res) => {
  try {
    writeJSONFile(DATA_FILE_PATH, DEFAULT_PRODUCTS);
    res.json({ success: true, products: DEFAULT_PRODUCTS });
  } catch (err) {
    console.error('Reset products error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset product file.' });
  }
});

// ==========================================
// Delivery Provider APIs
// ==========================================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'averysecretkey12345678901234567890'; // Should be 32 chars in production
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return text;
  // Pad key if necessary for simple local dev
  const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substr(0, 32);
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  try {
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substr(0, 32);
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch(e) {
    console.error('Decryption failed', e);
    return '';
  }
}

app.get('/api/delivery-providers', (req, res) => {
  const providers = readJSONFile(DELIVERY_PROVIDERS_FILE_PATH, []);
  // Return without secret_key for frontend security, or mask it
  const safeProviders = providers.map(p => ({
    ...p,
    secret_key: p.secret_key ? '********' : '' // Masked
  }));
  res.json(safeProviders);
});

app.post('/api/delivery-providers/update', (req, res) => {
  const updatedProviders = req.body; // Array of providers
  const currentProviders = readJSONFile(DELIVERY_PROVIDERS_FILE_PATH, []);
  
  const newProviders = updatedProviders.map(up => {
    const current = currentProviders.find(c => c.id === up.id) || {};
    return {
      ...up,
      // If the frontend sends '********', it means the secret hasn't changed. Keep the encrypted one.
      // If it sends something else, it's a new secret, so encrypt it.
      secret_key: (up.secret_key === '********') ? current.secret_key : encrypt(up.secret_key)
    };
  });
  
  writeJSONFile(DELIVERY_PROVIDERS_FILE_PATH, newProviders);
  res.json({ message: 'Delivery providers updated successfully' });
});

import * as providerManager from './shipping/providerManager.js';

app.post('/api/delivery-providers/test', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Provider ID required' });
  
  try {
    const currentProviders = readJSONFile(DELIVERY_PROVIDERS_FILE_PATH, []);
    const providerConfig = currentProviders.find(p => p.id === id);
    
    if (!providerConfig) {
      return res.status(404).json({ error: 'Provider config not found' });
    }

    // In a real app we decrypt the keys here to pass to the provider
    const result = await providerManager.testConnection(id, {
      api_key: providerConfig.api_key,
      secret_key: decrypt(providerConfig.secret_key)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Test Connection Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`TRIBAL COFFEE LOUNGE BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`Serving static images from public/`);
  console.log(`Serving dynamic persistence from local JSON files`);
  console.log(`====================================================`);
});
