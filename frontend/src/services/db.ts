export interface RealProduct {
  id: string;
  name: string;
  category: 'beans' | 'powder' | 'specialty' | 'filter';
  tagline: string;
  roast: string;
  roastLevel: number; // out of 5
  strength: number; // out of 5
  acidity: number; // out of 5
  body: number; // out of 5
  chicory: string; // e.g. "0%" or "40%"
  tastingNotes: string[];
  price: number; // In ₹ (INR) for Base Size
  price750g?: number; // In ₹ (INR) for Large Size
  size1Name?: string; // e.g. "350g"
  size2Name?: string; // e.g. "750g"
  originalPrice?: number; // In ₹ (INR)
  image: string;
  description: string;
  aromaDescription: string;
  bgGradient: string;
  glowColor: string;
}

export const API_BASE_URL = 'http://127.0.0.1:5001';

export const TRIBAL_PRODUCTS: RealProduct[] = [
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
    "image": "/images/Arabica Coffee Beans.opt.webp",
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
    "image": "/images/Arabica Fine Ground Powder.opt.webp",
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
    "image": "/images/Arabica Coarse Ground Powder.opt.webp",
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
    "image": "/images/South Indian Filter Coffee Powder.opt.webp",
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
    "image": "/images/Arabica Cold Brew Concentrate.opt.webp",
    "description": "Our signature cold-brewed nectar, slow-extracted over 24 hours in cold spring water from pure organic Araku Arabica beans. Yields an incredibly smooth, naturally sweet concentrate containing twice the caffeine kick of hot brew, with practically zero bitterness or acidity.",
    "aromaDescription": "Soft and delicate with undercurrents of fragrant night jasmine, vanilla bean pods, and light buttery toffee.",
    "bgGradient": "radial-gradient(circle at 50% 40%, rgba(83, 59, 40, 0.45) 0%, rgba(17, 17, 17, 1) 70%)",
    "glowColor": "rgba(154, 107, 66, 0.45)"
  }
];

const notifyListeners = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tribal-db-changed'));
  }
};

// Asynchronously load and cache products in the exported array reference
export async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`);
    if (res.ok) {
      const data = await res.json();
      TRIBAL_PRODUCTS.length = 0;
      TRIBAL_PRODUCTS.push(...data);
      notifyListeners();
      return TRIBAL_PRODUCTS;
    }
  } catch (e) {
    console.error('Failed to fetch products from Express backend API:', e);
  }
  return TRIBAL_PRODUCTS;
}

// Immediately trigger data sync on load
fetchProducts();

export async function addProduct(product: RealProduct) {
  // Immediate optimistic local update
  if (!TRIBAL_PRODUCTS.some(p => p.id === product.id)) {
    TRIBAL_PRODUCTS.push(product);
    notifyListeners();
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        TRIBAL_PRODUCTS.length = 0;
        TRIBAL_PRODUCTS.push(...result.products);
        notifyListeners();
      }
    }
  } catch (e) {
    console.error('Failed to add product on backend:', e);
  }
}

export async function updateProduct(updated: RealProduct) {
  // Immediate optimistic local update
  const idx = TRIBAL_PRODUCTS.findIndex(p => p.id === updated.id);
  if (idx !== -1) {
    TRIBAL_PRODUCTS[idx] = updated;
    notifyListeners();
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/products/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        TRIBAL_PRODUCTS.length = 0;
        TRIBAL_PRODUCTS.push(...result.products);
        notifyListeners();
      }
    }
  } catch (e) {
    console.error('Failed to update product on backend:', e);
  }
}

export async function deleteProduct(id: string) {
  // Immediate optimistic local update
  const idx = TRIBAL_PRODUCTS.findIndex(p => p.id === id);
  if (idx !== -1) {
    TRIBAL_PRODUCTS.splice(idx, 1);
    notifyListeners();
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        TRIBAL_PRODUCTS.length = 0;
        TRIBAL_PRODUCTS.push(...result.products);
        notifyListeners();
      }
    }
  } catch (e) {
    console.error('Failed to delete product on backend:', e);
  }
}

export function getProductById(id: string): RealProduct | undefined {
  return TRIBAL_PRODUCTS.find(p => p.id === id);
}

export function getProductsByCategory(category: 'beans' | 'powder' | 'specialty' | 'filter'): RealProduct[] {
  return TRIBAL_PRODUCTS.filter(p => p.category === category);
}

export async function resetDB() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/reset`, {
      method: 'POST'
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        TRIBAL_PRODUCTS.length = 0;
        TRIBAL_PRODUCTS.push(...result.products);
        notifyListeners();
      }
    }
  } catch (e) {
    console.error('Failed to reset product database:', e);
  }
}

