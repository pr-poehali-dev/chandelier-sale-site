const API_URLS = {
  products: 'https://functions.poehali.dev/5243cae0-7355-402e-9265-f37156d9f092',
  auth: 'https://functions.poehali.dev/84256c1a-006a-406a-a06d-fc59db888599',
  seedProducts: 'https://functions.poehali.dev/71dfe833-3fc1-4bd0-9390-deb2a875abc2',
  searchImage: 'https://functions.poehali.dev/35a79cb3-5e24-4538-9b39-eec115df5f7e',
  importProducts: 'https://functions.poehali.dev/a943bcc1-fe5a-4a70-94b6-9e426109f5b0',
  crawlProducts: 'https://functions.poehali.dev/716c1111-2419-4984-a5ca-e532a20654e2',
  orders: 'https://functions.poehali.dev/3ada9bb3-60ff-495f-a5f2-ddf20782173d',
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
  }): Promise<{ requiresVerification: boolean; email: string }> {
    const response = await fetch(`${API_URLS.auth}?action=register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: data.email, 
        password: data.password, 
        name: data.first_name 
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Ошибка регистрации');
    }
    
    return { 
      requiresVerification: result.email_verification_required !== false, 
      email: data.email 
    };
  },

  async verifyEmail(email: string, code: string): Promise<{ verified: boolean; message: string }> {
    const response = await fetch(`${API_URLS.auth}?action=verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Неверный код');
    }
    
    return { verified: true, message: result.message || 'Email подтверждён' };
  },

  async login(email: string, password: string): Promise<User> {
    const response = await fetch(`${API_URLS.auth}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Неверный email или пароль');
    }
    
    if (result.access_token) {
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('refresh_token', result.refresh_token);
    }
    
    return {
      user_id: result.user.id,
      email: result.user.email,
      first_name: result.user.name || '',
      token: result.access_token
    };
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

  async bulkCreateProducts(products: Omit<Product, 'id'>[]): Promise<{ success: number; errors: number; details?: string[] }> {
    const response = await fetch(API_URLS.products, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bulk create error:', response.status, errorText);
      throw new Error(`Failed to bulk create products: ${response.status}`);
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
      const errorText = await response.text();
      console.error('❌ Ошибка создания заказа:', response.status, errorText);
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.error || 'Не удалось оформить заказ');
      } catch {
        throw new Error(`Ошибка сервера (${response.status}). Попробуйте позже`);
      }
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