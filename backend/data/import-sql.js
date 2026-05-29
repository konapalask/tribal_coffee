import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFilePath = path.join(__dirname, '..', 'localhost (1).sql');
const usersFilePath = path.join(__dirname, 'users.json');
const bookingsFilePath = path.join(__dirname, 'bookings.json');

// --- Legacy Data Buffers ---
const ocCustomers = new Map();
const ocAddresses = new Map();
const wpUsers = new Map();
const wpUserMeta = new Map();
const wpPosts = new Map(); // order_id -> post details
const wpPostMeta = new Map(); // order_id -> meta map
const wpOrderItems = new Map(); // item_id -> order item
const wpOrderItemMeta = new Map(); // item_id -> meta map

// --- Lexer & Parser Helpers ---
function extractRowsFromLine(text) {
  const rows = [];
  let inString = false;
  let stringChar = null;
  let escape = false;
  let bracketDepth = 0;
  let current = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (escape) {
      current += char;
      escape = false;
      continue;
    }
    if (char === '\\') {
      current += char;
      escape = true;
      continue;
    }
    if (inString) {
      current += char;
      if (char === stringChar) {
        if (i + 1 < text.length && text[i + 1] === stringChar) {
          current += stringChar;
          i++;
        } else {
          inString = false;
        }
      }
    } else {
      if (char === '\'' || char === '"') {
        inString = true;
        stringChar = char;
        current += char;
      } else if (char === '(') {
        bracketDepth++;
        if (bracketDepth === 1) {
          current = ''; 
        } else {
          current += char;
        }
      } else if (char === ')') {
        bracketDepth--;
        if (bracketDepth === 0) {
          rows.push(current);
          current = '';
        } else {
          current += char;
        }
      } else {
        if (bracketDepth > 0) {
          current += char;
        }
      }
    }
  }
  return rows;
}

function parseRowValues(rowText) {
  const values = [];
  let inString = false;
  let stringChar = null;
  let escape = false;
  let current = '';
  
  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    if (escape) {
      current += char;
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (inString) {
      if (char === stringChar) {
        if (i + 1 < rowText.length && rowText[i + 1] === stringChar) {
          current += stringChar;
          i++;
        } else {
          inString = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '\'' || char === '"') {
        inString = true;
        stringChar = char;
      } else if (char === ',') {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  values.push(current.trim());
  return values.map(v => {
    if (v === 'NULL' || v === 'null') return null;
    return v;
  });
}

// --- SQL Row Handler ---
function handleRow(tableName, row) {
  switch (tableName) {
    case 'oc4c_customer': {
      if (row.length >= 18) {
        const id = row[0];
        const firstname = row[4];
        const lastname = row[5];
        const email = row[6];
        const telephone = row[7];
        const password = row[9];
        const salt = row[10];
        const address_id = row[14];
        const status = row[17];
        
        if (email && password) {
          ocCustomers.set(id, {
            id: `oc-${id}`,
            name: `${firstname || ''} ${lastname || ''}`.trim() || 'Connoisseur',
            email: email.toLowerCase().trim(),
            password,
            salt,
            telephone,
            address_id,
            status
          });
        }
      }
      break;
    }
    case 'oc4c_address': {
      if (row.length >= 9) {
        const address_id = row[0];
        const customer_id = row[1];
        const address_1 = row[5];
        const address_2 = row[6];
        const city = row[7];
        const postcode = row[8];
        
        const formatted = `${address_1 || ''}${address_2 ? ', ' + address_2 : ''}, ${city || ''} - ${postcode || ''}`.trim();
        ocAddresses.set(address_id, formatted);
      }
      break;
    }
    case 'wpox_users': {
      if (row.length >= 10) {
        const id = row[0];
        const email = row[4];
        const password = row[2];
        const name = row[9];
        
        if (email && password) {
          wpUsers.set(id, {
            id: `wp-${id}`,
            name: name || 'Connoisseur',
            email: email.toLowerCase().trim(),
            password
          });
        }
      }
      break;
    }
    case 'wpox_usermeta': {
      if (row.length >= 4) {
        const user_id = row[1];
        const meta_key = row[2];
        const meta_value = row[3];
        
        if (!wpUserMeta.has(user_id)) {
          wpUserMeta.set(user_id, {});
        }
        const meta = wpUserMeta.get(user_id);
        if (['billing_address_1', 'billing_address_2', 'billing_city', 'billing_postcode', 'billing_phone'].includes(meta_key)) {
          meta[meta_key] = meta_value;
        }
      }
      break;
    }
    case 'wpox_posts': {
      if (row.length >= 21) {
        const id = row[0];
        const post_date = row[2];
        const post_status = row[7];
        const post_type = row[20];
        
        if (post_type === 'shop_order') {
          wpPosts.set(id, {
            id,
            date: post_date,
            status: post_status
          });
        }
      }
      break;
    }
    case 'wpox_postmeta': {
      if (row.length >= 4) {
        const post_id = row[1];
        const meta_key = row[2];
        const meta_value = row[3];
        
        if (!wpPostMeta.has(post_id)) {
          wpPostMeta.set(post_id, {});
        }
        const meta = wpPostMeta.get(post_id);
        if (['_billing_email', '_billing_first_name', '_billing_last_name', '_billing_city', '_billing_postcode', '_order_total'].includes(meta_key)) {
          meta[meta_key] = meta_value;
        }
      }
      break;
    }
    case 'wpox_woocommerce_order_items': {
      if (row.length >= 4) {
        const item_id = row[0];
        const item_name = row[1];
        const order_id = row[3];
        
        wpOrderItems.set(item_id, {
          id: item_id,
          name: item_name,
          order_id
        });
      }
      break;
    }
    case 'wpox_woocommerce_order_itemmeta': {
      if (row.length >= 4) {
        const item_id = row[1];
        const meta_key = row[2];
        const meta_value = row[3];
        
        if (!wpOrderItemMeta.has(item_id)) {
          wpOrderItemMeta.set(item_id, {});
        }
        const meta = wpOrderItemMeta.get(item_id);
        if (['_line_total', '_qty'].includes(meta_key)) {
          meta[meta_key] = meta_value;
        }
      }
      break;
    }
  }
}

// --- Main Parser Entrypoint ---
async function main() {
  console.log('Starting legacy SQL data stream import...');
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`Error: SQL file not found at ${sqlFilePath}`);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(sqlFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let statementBuffer = '';
  let lineCount = 0;

  for await (const line of rl) {
    lineCount++;
    if (lineCount % 20000 === 0) {
      console.log(`Processed ${lineCount} SQL lines...`);
    }

    statementBuffer += line + '\n';
    if (line.trim().endsWith(';')) {
      const sql = statementBuffer.trim();
      statementBuffer = '';

      const insertMatch = sql.match(/INSERT INTO `([^`]+)`/);
      if (insertMatch) {
        const tableName = insertMatch[1];
        const valuesIdx = sql.toUpperCase().indexOf('VALUES');
        if (valuesIdx !== -1) {
          const valuesPart = sql.substring(valuesIdx + 6).trim();
          const rowsText = extractRowsFromLine(valuesPart);
          for (const rowText of rowsText) {
            const rowValues = parseRowValues(rowText);
            handleRow(tableName, rowValues);
          }
        }
      }
    }
  }

  console.log('SQL Parsing complete. Re-assembling database records...');

  // 1. Process and merge Users
  let existingUsers = [];
  if (fs.existsSync(usersFilePath)) {
    existingUsers = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
  }
  
  const initialAdmin = existingUsers.find(u => u.email === 'admin@tribalcoffee.in') || {
    id: 'adm-1',
    name: 'Sharmila K',
    email: 'admin@tribalcoffee.in',
    password: 'password123',
    role: 'Super Admin'
  };

  const usersMap = new Map();
  usersMap.set(initialAdmin.email, initialAdmin);
  
  // Merge existing non-admin users first to preserve them
  for (const user of existingUsers) {
    if (user.email !== 'admin@tribalcoffee.in' && (!user.id || (!user.id.startsWith('oc-') && !user.id.startsWith('wp-')))) {
      usersMap.set(user.email.toLowerCase(), user);
    }
  }

  // Import OpenCart customers
  for (const [ocId, customer] of ocCustomers.entries()) {
    if (usersMap.has(customer.email)) continue;
    
    // Lookup address
    let address = null;
    if (customer.address_id && ocAddresses.has(customer.address_id)) {
      address = ocAddresses.get(customer.address_id);
    }
    
    usersMap.set(customer.email, {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      password: customer.password,
      salt: customer.salt,
      role: 'Connoisseur',
      address,
      phone: customer.telephone
    });
  }

  // Import WordPress / WooCommerce users
  for (const [wpId, user] of wpUsers.entries()) {
    if (usersMap.has(user.email)) continue;
    
    // Lookup billing address & phone
    let address = null;
    let phone = null;
    if (wpUserMeta.has(wpId)) {
      const meta = wpUserMeta.get(wpId);
      if (meta.billing_address_1) {
        address = `${meta.billing_address_1}${meta.billing_address_2 ? ', ' + meta.billing_address_2 : ''}, ${meta.billing_city || ''} - ${meta.billing_postcode || ''}`.trim();
      }
      if (meta.billing_phone) {
        phone = meta.billing_phone;
      }
    }
    
    usersMap.set(user.email, {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: 'Connoisseur',
      address,
      phone
    });
  }

  const finalUsers = Array.from(usersMap.values());
  fs.writeFileSync(usersFilePath, JSON.stringify(finalUsers, null, 2), 'utf8');
  console.log(`Exported ${finalUsers.length} users (Added ${finalUsers.length - existingUsers.length} legacy users) into users.json.`);

  // 2. Process and merge Orders/Bookings
  let existingBookings = [];
  if (fs.existsSync(bookingsFilePath)) {
    existingBookings = JSON.parse(fs.readFileSync(bookingsFilePath, 'utf8'));
  }

  const bookingsMap = new Map();
  // Retain all current modern React bookings
  for (const b of existingBookings) {
    bookingsMap.set(b.id, b);
  }

  // Group items by order_id
  const orderItemsGrouped = new Map();
  for (const [itemId, item] of wpOrderItems.entries()) {
    const meta = wpOrderItemMeta.get(itemId) || {};
    const qty = parseInt(meta._qty || '1', 10);
    const lineTotal = parseFloat(meta._line_total || '0');
    
    if (!orderItemsGrouped.has(item.order_id)) {
      orderItemsGrouped.set(item.order_id, []);
    }
    
    orderItemsGrouped.get(item.order_id).push({
      name: item.name || 'Premium Coffee Blend',
      quantity: qty,
      price: qty > 0 ? Math.round(lineTotal / qty) : Math.round(lineTotal)
    });
  }

  // Build the WooCommerce orders in bookings format
  let addedOrdersCount = 0;
  for (const [orderId, post] of wpPosts.entries()) {
    const orderIdStr = `TRB-WP${orderId}`;
    if (bookingsMap.has(orderIdStr)) continue;

    const meta = wpPostMeta.get(orderId) || {};
    const email = meta._billing_email || '';
    if (!email) continue; // Skip order if no customer email associated

    const items = orderItemsGrouped.get(orderId) || [
      { name: 'Premium Coffee Selection', quantity: 1, price: Math.round(parseFloat(meta._order_total || '0')) }
    ];
    
    const amount = Math.round(parseFloat(meta._order_total || '0'));
    const customerName = `${meta._billing_first_name || ''} ${meta._billing_last_name || ''}`.trim() || 'Connoisseur';
    const city = meta._billing_city || 'India';
    const pincode = meta._billing_postcode || '';

    // Convert legacy date to local format
    let dateStr = '01/01/2026';
    if (post.date && post.date !== '0000-00-00 00:00:00') {
      const dt = new Date(post.date);
      if (!isNaN(dt.getTime())) {
        dateStr = `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
      }
    }

    // Map WooCommerce status to React system status
    let status = undefined;
    if (post.status === 'wc-completed') {
      status = 'Dispatched'; // Set legacy completed to Dispatched to reflect completed orders in layout
    }

    bookingsMap.set(orderIdStr, {
      id: orderIdStr,
      date: dateStr,
      email: email.toLowerCase().trim(),
      customerName,
      city,
      pincode,
      items,
      amount,
      status
    });
    addedOrdersCount++;
  }

  const finalBookings = Array.from(bookingsMap.values());
  // Sort bookings so newest are at the top (TRB- prefix or date parsed)
  fs.writeFileSync(bookingsFilePath, JSON.stringify(finalBookings, null, 2), 'utf8');
  console.log(`Exported ${finalBookings.length} total orders (Added ${addedOrdersCount} legacy orders) into bookings.json.`);
  console.log('Legacy data integration completed successfully!');
}

main().catch(err => {
  console.error('Migration failed:', err);
});
