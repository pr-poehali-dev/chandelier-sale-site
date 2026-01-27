import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminAuth from '@/components/admin/AdminAuth';
import AdminHeader from '@/components/admin/AdminHeader';
import ProductForm from '@/components/admin/ProductForm';
import ProductList from '@/components/admin/ProductList';
import BestDealsManager from '@/components/admin/BestDealsManager';

const ADMIN_AUTH_URL = 'https://functions.poehali.dev/44942252-4c42-4971-9ae8-c9e43de1ca10';
const ADMIN_PRODUCTS_URL = 'https://functions.poehali.dev/722ef0fd-ab85-4438-b34d-464a0b50d4d7';
const UPLOAD_IMAGE_URL = 'https://functions.poehali.dev/e3579ac7-cd2e-4676-b1ff-8833a602ad6f';

interface Admin {
  id: number;
  email: string;
  name: string;
}

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'best-deals'>('list');
  
  console.log('AdminPanel activeTab:', activeTab);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(ADMIN_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'verify' })
      });

      const data = await response.json();
      if (data.valid) {
        setIsAuthenticated(true);
        setAdmin(data.admin);
      } else {
        localStorage.removeItem('admin_token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('admin_token');
    }
  };

  const handleAuthSuccess = (adminData: Admin, token: string) => {
    localStorage.setItem('admin_token', token);
    setIsAuthenticated(true);
    setAdmin(adminData);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setAdmin(null);
  };

  const handleProductAdded = () => {
    setActiveTab('list');
  };

  if (!isAuthenticated) {
    return (
      <AdminAuth
        adminAuthUrl={ADMIN_AUTH_URL}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onAuthClick={() => {}} cartItemsCount={0} onCartClick={() => {}} />
      
      <AdminHeader
        admin={admin}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        {activeTab === 'add' && (
          <ProductForm
            adminProductsUrl={ADMIN_PRODUCTS_URL}
            uploadImageUrl={UPLOAD_IMAGE_URL}
            onProductAdded={handleProductAdded}
          />
        )}

        {activeTab === 'list' && (
          <ProductList
            adminProductsUrl={ADMIN_PRODUCTS_URL}
            uploadImageUrl={UPLOAD_IMAGE_URL}
            isAuthenticated={isAuthenticated}
            activeTab={activeTab}
          />
        )}

        {activeTab === 'best-deals' && (
          <BestDealsManager />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminPanel;
