// Product Service for E5 Wheels API Integration

const API_BASE_URL = 'https://api.autosyncstudio.com/wheels';
const API_KEY = 'efive';

export interface WheelProduct {
  Accent: string | null;
  BoltCircle1: number;
  BoltCircle2: number;
  Bore: number;
  Brand: string;
  Bsm: string | null;
  Color: string;
  Diameter: number;
  ExposedLugs: boolean;
  FaceStyle: string;
  Finish: string | null;
  Gtin: string | null;
  Id: number;
  Img0001: string;
  Img0002: string;
  Img0003: string;
  InStock: boolean;
  Inventory: number;
  LipSize: string | null;
  LoadRating: number;
  LugCount: number;
  LugType: string;
  Material: string;
  Model: string;
  NicheTag: string;
  Offset: number;
  Orientation: string;
  Pn: string;
  Position: string;
  Price: number;
  SegmentTags: string[];
  ShortColor: string;
  ShortFinish: string | null;
  Structure: string;
  StyleId: number;
  Submodel: string;
  Upc: string;
  UpdatedAt: string;
  VehicleTypeTags: string[];
  Weight: number | null;
  Width: number;
}

export interface WheelsApiResponse {
  ImgUrlBase: string;
  MoreItems: boolean;
  Wheels: WheelProduct[];
}

export interface CartItem {
  product: WheelProduct;
  quantity: number;
  frontWheels: number; // e.g., 2
  rearWheels: number; // e.g., 2
  vehicleModel?: string; // e.g., "C8 Z06"
  imgUrlBase?: string; // Image URL base from API
}

/**
 * Fetches wheels from the API with pagination support
 */
async function fetchWheelsPage(
  pageNumber: number,
  pageSize: number,
  filters?: {
    model?: string;
    color?: string;
    diameter?: number;
    inStockOnly?: boolean;
  }
): Promise<WheelsApiResponse> {
  const params = new URLSearchParams({
    key: API_KEY,
    'p-number': pageNumber.toString(),
    'p-size': pageSize.toString(),
    'i-img0001': 'true',
    'i-img0002': 'true',
    'i-img0003': 'true',
    'i-inStock': 'true',
    'i-inventory': 'true',
    'i-price': 'true',
    'i-specs': 'true',
    'i-tags': 'true',
    'i-updatedAt': 'true',
  });

  // Add filters if provided
  if (filters?.model) {
    params.append('f-model', filters.model);
  }
  if (filters?.color) {
    params.append('f-color', filters.color);
  }
  if (filters?.diameter) {
    params.append('f-diameter', filters.diameter.toString());
  }
  if (filters?.inStockOnly) {
    params.append('f-inStock', 'true');
  }

  const response = await fetch(`${API_BASE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch wheels: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches all wheels from the API (handles pagination automatically)
 */
export async function fetchWheels(filters?: {
  model?: string;
  color?: string;
  diameter?: number;
  inStockOnly?: boolean;
}): Promise<WheelsApiResponse> {
  const pageSize = 100; // Fetch 100 items per page
  let pageNumber = 1;
  let allWheels: WheelProduct[] = [];
  let imgUrlBase = '';
  let hasMoreItems = true;

  // Keep fetching until we have all products
  while (hasMoreItems) {
    const response = await fetchWheelsPage(pageNumber, pageSize, filters);

    // Store the image URL base from the first response
    if (pageNumber === 1) {
      imgUrlBase = response.ImgUrlBase;
    }

    // Add wheels from this page to our collection
    allWheels = [...allWheels, ...response.Wheels];

    // Check if there are more items to fetch
    hasMoreItems = response.MoreItems;
    pageNumber++;

    // Safety check: limit to 10 pages (1000 products max)
    if (pageNumber > 10) {
      console.warn('Reached maximum page limit (10 pages). Some products may not be loaded.');
      break;
    }
  }

  return {
    ImgUrlBase: imgUrlBase,
    MoreItems: false, // We've fetched everything
    Wheels: allWheels,
  };
}

/**
 * Fetches a single wheel by Part Number (Pn)
 */
export async function fetchWheelByPn(pn: string): Promise<WheelProduct | null> {
  const response = await fetchWheels();
  const wheel = response.Wheels.find(w => w.Pn === pn);
  return wheel || null;
}

/**
 * Fetches a single wheel by ID
 */
export async function fetchWheelById(id: number): Promise<WheelProduct | null> {
  const response = await fetchWheels();
  const wheel = response.Wheels.find(w => w.Id === id);
  return wheel || null;
}

/**
 * Gets the full image URL for a wheel
 */
export function getWheelImageUrl(imgUrlBase: string, imgPath: string): string {
  return `${imgUrlBase}${imgPath}`;
}

/**
 * Formats price to USD currency string
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

/**
 * Gets wheel display name with finish
 */
export function getWheelDisplayName(wheel: WheelProduct): string {
  const finish = wheel.ShortFinish || wheel.Finish || '';
  const color = wheel.ShortColor || wheel.Color || '';
  return `${wheel.Model} - ${color} ${finish}`.trim();
}

/**
 * Calculates cart totals
 */
export function calculateCartTotals(items: CartItem[], taxRate: number = 0.07) {
  const subtotal = items.reduce((sum, item) => {
    const totalWheels = item.frontWheels + item.rearWheels;
    return sum + (item.product.Price * totalWheels * item.quantity);
  }, 0);

  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return {
    subtotal,
    tax,
    total,
    affirmMonthly: Math.ceil(total / 18), // 18 months financing
  };
}

/**
 * Cart management using localStorage
 */
export const CartManager = {
  STORAGE_KEY: 'e5_cart',

  getCart(): CartItem[] {
    if (typeof window === 'undefined') return [];
    const cartData = localStorage.getItem(this.STORAGE_KEY);
    return cartData ? JSON.parse(cartData) : [];
  },

  saveCart(items: CartItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  },

  addItem(item: CartItem): void {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(
      i => i.product.Id === item.product.Id
    );

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += item.quantity;
    } else {
      cart.push(item);
    }

    this.saveCart(cart);
  },

  updateQuantity(productId: number, quantity: number): void {
    const cart = this.getCart();
    const item = cart.find(i => i.product.Id === productId);

    if (item) {
      item.quantity = Math.max(1, quantity);
      this.saveCart(cart);
    }
  },

  removeItem(productId: number): void {
    const cart = this.getCart();
    const filtered = cart.filter(i => i.product.Id !== productId);
    this.saveCart(filtered);
  },

  clearCart(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
  },

  getItemCount(): number {
    return this.getCart().reduce((sum, item) => sum + item.quantity, 0);
  },
};
