const API_URLS = {
  products: 'https://functions.poehali.dev/c44b8670-1a85-41f5-9bd4-b828cbf10cca',
  auth: 'https://functions.poehali.dev/8ff2e88b-9f98-45e4-8e1a-0c1196c9196a',
  seedProducts: 'https://functions.poehali.dev/d89a79eb-294c-455c-84e8-5ffe2b6b99d0',
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
}

export interface User {
  user_id: number;
  email: string;
  first_name: string;
  last_name?: string;
  token: string;
}

export const api = {
  async getProducts(filters?: {
    brand?: string;
    type?: string;
    min_price?: number;
    max_price?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; count: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }
    
    const url = `${API_URLS.products}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
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
};
