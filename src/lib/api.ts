const API_URLS = {
  products: 'https://functions.poehali.dev/c44b8670-1a85-41f5-9bd4-b828cbf10cca',
  auth: 'https://functions.poehali.dev/8ff2e88b-9f98-45e4-8e1a-0c1196c9196a',
  seedProducts: 'https://functions.poehali.dev/d89a79eb-294c-455c-84e8-5ffe2b6b99d0',
  searchImage: 'https://functions.poehali.dev/17e374a7-17b7-4c8c-b4a0-995daf6c4467',
  importProducts: 'https://functions.poehali.dev/c24a558f-7384-4e33-82a3-45fbe5aa34e1',
  crawlProducts: 'https://functions.poehali.dev/5845aa6f-cc5c-416c-86f8-13f4d13f0f2e',
  orders: 'https://functions.poehali.dev/fcd6dd35-a3e6-4d67-978f-190d82e2575a',
};

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  brand: string;
  type: string;
  image: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  hasRemote?: boolean;
  isDimmable?: boolean;
  hasColorChange?: boolean;
  
  // Основные характеристики
  article?: string;
  brandCountry?: string;
  manufacturerCountry?: string;
  collection?: string;
  style?: string;
  
  // Лампы
  lampType?: string;
  socketType?: string;
  bulbType?: string;
  lampCount?: number;
  lampPower?: number;
  totalPower?: number;
  lightingArea?: number;
  voltage?: number;
  
  // Цвет и материал
  color?: string;
  materials?: string;
  frameMaterial?: string;
  shadeMaterial?: string;
  frameColor?: string;
  shadeColor?: string;
  
  // Размеры
  height?: number;
  diameter?: number;
  length?: number;
  width?: number;
  depth?: number;
  chainLength?: number;
  
  // Характеристики плафона
  shadeDirection?: string;
  diffuserType?: string;
  diffuserShape?: string;
  
  // Защита и размещение
  ipRating?: string;
  interior?: string;
  place?: string;
  suspendedCeiling?: boolean;
  mountType?: string;
  
  // Гарантия
  officialWarranty?: string;
  shopWarranty?: string;
  
  // Категоризация
  section?: string;
  catalog?: string;
  subcategory?: string;
  category?: string;
  
  // Дополнительные изображения
  images?: string[];
  
  // Инструкция по сборке
  assemblyInstructionUrl?: string;
}

export interface User {
  user_id: number;
  email: string;
  first_name: string;
  last_name?: string;
  token: string;
}

export interface OrderItem {
  product_id: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: string;
  payment_method: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export const api = {
  async getProducts(filters?: {
    brand?: string;
    brands?: string;
    category?: string;
    type?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
    has_remote?: string;
    is_dimmable?: string;
    has_color_change?: string;
    is_sale?: string;
    is_new?: string;
    pickup_available?: string;
    styles?: string;
    colors?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }
    
    const url = `${API_URLS.products}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  async getProductById(id: number): Promise<Product | null> {
    const params = new URLSearchParams({ id: String(id) });
    const url = `${API_URLS.products}?${params.toString()}`;
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch product');
    const data = await response.json();
    return data.products && data.products.length > 0 ? data.products[0] : null;
  },

  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name?: string;
    phone?: string;
  }): Promise<User> {
    const response = await fetch(API_URLS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', ...data }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    
    return response.json();
  },

  async login(email: string, password: string): Promise<User> {
    const response = await fetch(API_URLS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    return response.json();
  },

  async seedProducts(): Promise<{ message: string; added: number; total: number }> {
    const response = await fetch(API_URLS.seedProducts, {
      method: 'POST',
    });
    
    if (!response.ok) throw new Error('Failed to seed products');
    return response.json();
  },

  async searchByImage(imageBase64: string): Promise<{
    products: Product[];
    description: string;
    detected_type: string | null;
  }> {
    const response = await fetch(API_URLS.searchImage, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Image search failed');
    }
    
    return response.json();
  },

  async createProduct(data: Omit<Product, 'id'>): Promise<Product> {
    const response = await fetch(API_URLS.products, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create product error:', response.status, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || errorJson.message || 'Failed to create product');
      } catch {
        throw new Error(`Failed to create product: ${response.status} ${errorText}`);
      }
    }
    return response.json();
  },

  async updateProduct(id: number, data: Partial<Omit<Product, 'id'>>): Promise<Product> {
    const response = await fetch(`${API_URLS.products}?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error('Failed to update product');
    return response.json();
  },

  async deleteProduct(id: number): Promise<void> {
    const response = await fetch(`${API_URLS.products}?id=${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) throw new Error('Failed to delete product');
  },

  async deleteProducts(ids: number[]): Promise<void> {
    const response = await fetch(API_URLS.products, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    
    if (!response.ok) throw new Error('Failed to delete products');
  },

  async importProducts(urls: string[]): Promise<{
    imported: number;
    failed: number;
    failed_urls: Array<{ url: string; reason: string }>;
  }> {
    const response = await fetch(API_URLS.importProducts, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to import products');
    }
    
    return response.json();
  },

  async crawlProducts(startUrl: string, maxPages: number = 10): Promise<{
    success: boolean;
    pages_crawled: number;
    product_urls: string[];
    total_found: number;
  }> {
    const response = await fetch(API_URLS.crawlProducts, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_url: startUrl, max_pages: maxPages }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to crawl products');
    }
    
    return response.json();
  },

  async createOrder(data: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
    payment_method: string;
    items: OrderItem[];
  }): Promise<{ order_id: number; status: string; total_amount: number }> {
    const response = await fetch(API_URLS.orders, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create order');
    }
    
    return response.json();
  },

  async getOrders(): Promise<{ orders: Order[] }> {
    const response = await fetch(API_URLS.orders);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  async getOrder(id: number): Promise<Order> {
    const response = await fetch(`${API_URLS.orders}?id=${id}`);
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
  },

  async updateOrder(id: number, data: { status?: string; tracking_number?: string }): Promise<{ message: string }> {
    const response = await fetch(`${API_URLS.orders}?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update order');
    }
    
    return response.json();
  },
};