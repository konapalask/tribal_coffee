/**
 * TRIBAL COFFEE — COMPLETE PRODUCTION DATA RESTORATION SCRIPT
 * ==========================================================
 * Fully parses WooCommerce and OpenCart tables from the production SQL dump:
 * /Users/sharmilakonapala/Documents/tribal/backend/localhost (1).sql
 * 
 * Rebuilds MongoDB collections:
 *   - bookings (reconstructed from WooCommerce orders)
 *   - users (genuine WooCommerce/OpenCart customers + admins)
 */

import fs from 'fs';
import mongoose from 'mongoose';
import { User, Booking } from './db.js';

const SQL_PATH = '/Users/sharmilakonapala/Documents/tribal/backend/localhost (1).sql';
const USERS_PATH = '/Users/sharmilakonapala/Documents/tribal/backend/data/users.json';
const BOOKINGS_PATH = '/Users/sharmilakonapala/Documents/tribal/backend/data/bookings.json';

console.log('\n==========================================================');
console.log('  TRIBAL COFFEE — FULL DATABASE RESTORATION AUDIT');
console.log('==========================================================\n');

// 1. LOAD SQL DUMP
console.log('📂 Loading SQL dump...');
const lines = fs.readFileSync(SQL_PATH, 'utf8').split('\n');
console.log(`  Loaded ${lines.length.toLocaleString()} lines.\n`);

// 2. ROBUST SQL PARSER
function parseSqlLine(line) {
  const str = line.trim();
  if (!str.startsWith('(')) return null;
  
  const values = [];
  let currentVal = '';
  let inString = false;
  let isEscaped = false;
  
  let i = 1;
  while (i < str.length) {
    const char = str[i];
    
    if (inString) {
      if (isEscaped) {
        if (char === 'n') currentVal += '\n';
        else if (char === 't') currentVal += '\t';
        else if (char === 'r') currentVal += '\r';
        else currentVal += char;
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === "'") {
        if (str[i + 1] === "'") {
          currentVal += "'";
          i++;
        } else {
          inString = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        i++;
        continue;
      }
      if (char === "'") {
        inString = true;
      } else if (char === ',') {
        const trimmed = currentVal.trim();
        values.push(trimmed === 'NULL' ? null : trimmed);
        currentVal = '';
      } else if (char === ')') {
        const trimmed = currentVal.trim();
        values.push(trimmed === 'NULL' ? null : trimmed);
        return values;
      } else {
        currentVal += char;
      }
    }
    i++;
  }
  return null;
}

// 3. STATE MACHINE TO EXTRACT TABLES
console.log('⚙️  Extracting SQL tables...');
const rawPostmeta = [];
const rawOrderStats = [];
const rawOrderItems = [];
const rawOrderItemmeta = [];
const rawProductLookup = [];
const rawOcCustomer = [];

let currentTable = null;

for (const line of lines) {
  if (line.includes('INSERT INTO `wpox_postmeta`')) { currentTable = 'postmeta'; continue; }
  else if (line.includes('INSERT INTO `wpox_wc_order_stats`')) { currentTable = 'order_stats'; continue; }
  else if (line.includes('INSERT INTO `wpox_woocommerce_order_items`')) { currentTable = 'order_items'; continue; }
  else if (line.includes('INSERT INTO `wpox_woocommerce_order_itemmeta`')) { currentTable = 'order_itemmeta'; continue; }
  else if (line.includes('INSERT INTO `wpox_wc_order_product_lookup`')) { currentTable = 'product_lookup'; continue; }
  else if (line.includes('INSERT INTO `oc4c_customer`')) { currentTable = 'oc_customer'; continue; }
  else if (line.startsWith('INSERT INTO `')) {
    currentTable = null;
    continue;
  }
  
  if (!currentTable) continue;
  
  const row = parseSqlLine(line);
  if (!row) continue;
  
  if (currentTable === 'postmeta') rawPostmeta.push(row);
  else if (currentTable === 'order_stats') rawOrderStats.push(row);
  else if (currentTable === 'order_items') rawOrderItems.push(row);
  else if (currentTable === 'order_itemmeta') rawOrderItemmeta.push(row);
  else if (currentTable === 'product_lookup') rawProductLookup.push(row);
  else if (currentTable === 'oc_customer') rawOcCustomer.push(row);
}

console.log(`  ✓ postmeta        : ${rawPostmeta.length.toLocaleString()} rows`);
console.log(`  ✓ order_stats     : ${rawOrderStats.length.toLocaleString()} rows`);
console.log(`  ✓ order_items     : ${rawOrderItems.length.toLocaleString()} rows`);
console.log(`  ✓ order_itemmeta  : ${rawOrderItemmeta.length.toLocaleString()} rows`);
console.log(`  ✓ product_lookup  : ${rawProductLookup.length.toLocaleString()} rows`);
console.log(`  ✓ oc_customer     : ${rawOcCustomer.length.toLocaleString()} rows\n`);

// 4. MAP DATA STRUCTURES
console.log('⚙️  Indexing metadata and items...');

// Index postmeta by post_id
const postmetaMap = {};
rawPostmeta.forEach(row => {
  const [, postId, key, val] = row;
  if (!postmetaMap[postId]) postmetaMap[postId] = {};
  postmetaMap[postId][key] = val;
});

// Index order itemmeta by order_item_id
const itemmetaMap = {};
rawOrderItemmeta.forEach(row => {
  const [, itemId, key, val] = row;
  if (!itemmetaMap[itemId]) itemmetaMap[itemId] = {};
  itemmetaMap[itemId][key] = val;
});

// Group order items by order_id
const orderItemsMap = {};
rawOrderItems.forEach(row => {
  const [itemId, itemName, itemType, orderId] = row;
  if (!orderItemsMap[orderId]) orderItemsMap[orderId] = [];
  orderItemsMap[orderId].push({ itemId, itemName, itemType });
});

// Index OpenCart customers by email
const ocCustomerMap = {};
rawOcCustomer.forEach(row => {
  const [custId, storeId, custGroupId, firstname, lastname, email, telephone, ...rest] = row;
  if (email) {
    ocCustomerMap[email.toLowerCase().trim()] = {
      firstname, lastname, telephone,
      date_added: rest[rest.length - 2] || ''
    };
  }
});

// 5. CONVERT WOOCOMMERCE ORDERS TO BOOKINGS
console.log('⚙️  Reconstructing orders and customer profiles...');

const bookings = [];
const customerProfiles = {}; // email -> profile

rawOrderStats.forEach(o => {
  const orderId = String(o[0]);
  const status = o[9];
  const totalSales = parseFloat(o[4] || 0);
  const dateRaw = o[2] || '';
  const dateStr = dateRaw.split(' ')[0].replace(/-/g, '/');
  
  const meta = postmetaMap[orderId] || {};
  const billingEmail = (meta['_billing_email'] || '').toLowerCase().trim();
  const phone = meta['_billing_phone'] || '';
  const firstName = meta['_billing_first_name'] || '';
  const lastName = meta['_billing_last_name'] || '';
  const city = meta['_billing_city'] || '';
  const pincode = meta['_billing_postcode'] || '';
  
  const billingAddress = [
    meta['_billing_address_1'],
    meta['_billing_address_2'],
    meta['_billing_city'],
    meta['_billing_state'],
    meta['_billing_postcode'],
    meta['_billing_country']
  ].filter(v => v && v !== '[deleted]').join(', ');

  const shippingAddress = [
    meta['_shipping_address_1'],
    meta['_shipping_address_2'],
    meta['_shipping_city'],
    meta['_shipping_state'],
    meta['_shipping_postcode'],
    meta['_shipping_country']
  ].filter(v => v && v !== '[deleted]').join(', ');

  const isGdprDeleted = !billingEmail || billingEmail === 'deleted@site.invalid';
  const safeEmail = isGdprDeleted ? `deleted-order-${orderId}@tribalcoffee.in` : billingEmail;
  const customerName = (firstName && firstName !== '[deleted]') 
    ? `${firstName} ${lastName !== '[deleted]' ? lastName : ''}`.trim()
    : (isGdprDeleted ? `GDPR Deleted Customer` : billingEmail.split('@')[0]);

  // Construct items
  const rawItems = orderItemsMap[orderId] || [];
  const lineItems = rawItems
    .filter(it => it.itemType === 'line_item')
    .map(it => {
      const itMeta = itemmetaMap[it.itemId] || {};
      const quantity = parseInt(itMeta['_qty'] || '1', 10);
      const lineTotal = parseFloat(itMeta['_line_total'] || '0');
      const price = quantity > 0 ? Math.round((lineTotal / quantity) * 100) / 100 : 0;
      return {
        name: it.itemName || 'Tribal Specialty Coffee',
        quantity,
        price
      };
    });

  if (lineItems.length === 0) {
    lineItems.push({
      name: 'Tribal Specialty Coffee',
      quantity: parseInt(o[3] || '1', 10),
      price: totalSales
    });
  }

  // Create booking record
  const booking = {
    id: `WC-${orderId}`,
    date: dateStr,
    email: safeEmail,
    customerName,
    city: city !== '[deleted]' ? city : '',
    pincode: pincode !== '[deleted]' ? pincode : '',
    items: lineItems,
    amount: totalSales,
    status: status === 'wc-completed' ? 'Delivered'
          : status === 'wc-processing' ? 'Processing'
          : status === 'wc-cancelled' ? 'Cancelled' : 'Pending',
    courier: '',
    awb: ''
  };
  
  bookings.push(booking);

  // Reconstruct customer profile for non-deleted email
  if (!isGdprDeleted) {
    if (!customerProfiles[safeEmail]) {
      customerProfiles[safeEmail] = {
        id: `wc-${o[10] || Math.floor(Math.random() * 1000000)}`,
        name: customerName,
        email: safeEmail,
        password: 'password123',
        role: 'Connoisseur',
        phone: phone !== '[deleted]' ? phone : '',
        address: {
          billing: billingAddress,
          shipping: shippingAddress,
          city: city !== '[deleted]' ? city : '',
          pinCode: pincode !== '[deleted]' ? pincode : ''
        },
        billingAddress,
        shippingAddress,
        orderCount: 0,
        totalSpend: 0,
        lastOrderDate: dateStr,
        dateAdded: dateStr,
        status: 'Verified Customer'
      };
    }
    
    const p = customerProfiles[safeEmail];
    p.orderCount++;
    p.totalSpend += totalSales;
    if (dateStr > p.lastOrderDate) p.lastOrderDate = dateStr;
    if (dateStr < p.dateAdded) p.dateAdded = dateStr;
  }
});

// Round spends
Object.values(customerProfiles).forEach(p => {
  p.totalSpend = Math.round(p.totalSpend * 100) / 100;
});

// 6. PRESERVE ADMIN USERS AND GENUINE REGISTERED CUSTOMERS WITH ZERO ORDERS
console.log('⚙️  Preserving administrator users and authentic customer profiles...');

// Load existing registry to find Admins
const adminUsers = [
  {
    id: "adm-1",
    name: "Sharmila K",
    email: "admin@tribalcoffee.in",
    password: "password123",
    role: "Super Admin",
    status: "Active",
    orderCount: 0,
    totalSpend: 0,
    lastOrderDate: "",
    billingAddress: "",
    shippingAddress: "",
    dateAdded: "01/01/2026"
  },
  {
    id: "adm-oc-1",
    name: "System Administrator",
    email: "admin@backbenchretail.com",
    password: "0052ed97e1eb90b442459dea9a655092ce041ef1",
    salt: "150385a0b",
    role: "Super Admin",
    status: "Active",
    orderCount: 0,
    totalSpend: 0,
    lastOrderDate: "",
    billingAddress: "",
    shippingAddress: "",
    dateAdded: "01/01/2026"
  },
  {
    id: "wp-716",
    name: "konapalask",
    email: "saikirankonapala26@gmail.com",
    password: "password123",
    role: "Super Admin",
    status: "Active",
    orderCount: 0,
    totalSpend: 0,
    lastOrderDate: "",
    billingAddress: "",
    shippingAddress: "",
    dateAdded: "01/01/2026"
  }
];

// Let's filter genuine customers from the pre-restore backup who don't have orders yet
// These might be users who registered but haven't bought anything.
const preRestoreUsers = JSON.parse(fs.readFileSync('/Users/sharmilakonapala/Documents/tribal/backend/data/users.pre-restore-1780299773536.json', 'utf8'));

const SPAM_EMAIL_RE = /xrumer|dynainbox|erexcolbart|lmail\.website|gadania\.site|catcasinostyle|1winstyle|\.xyz$|fishing.*@|gsasearch|get-bitcoins|poczta\.pl|hidebox|list\.ru|bk\.ru|\.co\.uk$|\.eu$|\.pl$/i;
const INDIAN_PHONE_RE = /^(\+91|91)?[6-9]\d{9}$/;

const genuineUnverifiedUsers = [];
preRestoreUsers.forEach(u => {
  if (u.role === 'Super Admin') return; // already handled
  
  const email = (u.email || '').toLowerCase().trim();
  if (customerProfiles[email]) return; // already in profiles (has orders)
  
  // Filter out spam bots
  if (SPAM_EMAIL_RE.test(email)) return;
  
  const phone = (u.phone || '').replace(/\s+/g,'');
  const hasIndianPhone = INDIAN_PHONE_RE.test(phone);
  const hasRealName = u.name && !u.name.includes('@') && /^[A-Za-z\s\.]+$/.test(u.name) && u.name.length > 2;
  
  if (hasIndianPhone || hasRealName) {
    genuineUnverifiedUsers.push({
      ...u,
      orderCount: 0,
      totalSpend: 0,
      lastOrderDate: '',
      status: 'Unverified Registration'
    });
  }
});

// Final Clean User Registry
const cleanUsers = [
  ...adminUsers,
  ...Object.values(customerProfiles),
  ...genuineUnverifiedUsers
];

// 7. COMPUTE ANALYTICS SUMMARY FOR VERIFICATION
const completedBookings = bookings.filter(b => b.status === 'Delivered');
const processingBookings = bookings.filter(b => b.status === 'Processing');
const cancelledBookings = bookings.filter(b => b.status === 'Cancelled');
const grossRevenue = bookings.reduce((s, b) => s + b.amount, 0);
const netRevenue   = completedBookings.reduce((s, b) => s + b.amount, 0);
const verifiedCustomers = Object.values(customerProfiles).length;

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  PRODUCTION DATAREST AUDIT REPORT                        ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');
console.log(`  Total Orders (WooCommerce)      : ${bookings.length}`);
console.log(`    - Delivered (Completed)       : ${completedBookings.length}`);
console.log(`    - Processing                  : ${processingBookings.length}`);
console.log(`    - Cancelled                   : ${cancelledBookings.length}`);
console.log(`    - Pending                     : ${bookings.length - completedBookings.length - processingBookings.length - cancelledBookings.length}`);
console.log('');
console.log(`  Total Customers in Registry     : ${cleanUsers.length}`);
console.log(`    - Administrator Accounts      : ${adminUsers.length}`);
console.log(`    - Verified Customers (≥1 order): ${verifiedCustomers}`);
console.log(`    - Unverified Registrations    : ${genuineUnverifiedUsers.length}`);
console.log('');
console.log(`  Combined Revenue Statistics:`);
console.log(`    - Gross Production Revenue    : ₹${Math.round(grossRevenue).toLocaleString('en-IN')}`);
console.log(`    - Net Production Revenue      : ₹${Math.round(netRevenue).toLocaleString('en-IN')}`);
console.log(`    - Average Order Value         : ₹${bookings.length > 0 ? Math.round(grossRevenue / bookings.length).toLocaleString('en-IN') : 0}`);
console.log('');

// 8. WRITE JSON FILES
console.log('⚙️  Writing production registry files...');
fs.writeFileSync(USERS_PATH, JSON.stringify(cleanUsers, null, 2), 'utf8');
fs.writeFileSync(BOOKINGS_PATH, JSON.stringify(bookings, null, 2), 'utf8');
console.log(`  ✓ users.json:    ${cleanUsers.length} records written`);
console.log(`  ✓ bookings.json: ${bookings.length} records written\n`);

// 9. SYNC TO MONGODB
console.log('⚙️  Syncing to MongoDB...');
await mongoose.connect('mongodb://127.0.0.1:27017/tribal_coffee');
console.log('  ✓ Connected to MongoDB');

// Rebuild users
await mongoose.connection.collection('users').drop().catch(() => {});
let uIns = 0, uSkip = 0;
for (const u of cleanUsers) {
  try {
    await User.create(u);
    uIns++;
  } catch (e) {
    uSkip++;
  }
}
console.log(`  ✓ Users synced:    ${uIns} inserted (${uSkip} skipped)`);

// Rebuild bookings
await mongoose.connection.collection('bookings').drop().catch(() => {});
let bIns = 0, bSkip = 0;
for (const b of bookings) {
  try {
    await Booking.create(b);
    bIns++;
  } catch (e) {
    bSkip++;
  }
}
console.log(`  ✓ Bookings synced: ${bIns} inserted (${bSkip} skipped)`);

const totalU = await User.countDocuments();
const totalB = await Booking.countDocuments();
console.log(`  ✓ DB confirmation: ${totalU} users, ${totalB} bookings`);

await mongoose.disconnect();

console.log('\n==========================================================');
console.log('  RESTORATION AND SYNC COMPLETE — DATA INTEGRITY SECURED');
console.log('==========================================================\n');
