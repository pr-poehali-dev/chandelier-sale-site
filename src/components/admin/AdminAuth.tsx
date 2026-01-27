import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface Admin {
  id: number;
  email: string;
  name: string;
}

interface AdminAuthProps {
  adminAuthUrl: string;
  onAuthSuccess: (admin: Admin, token: string) => void;
}

const AdminAuth = ({ adminAuthUrl, onAuthSuccess }: AdminAuthProps) => {
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const action = showLogin ? 'login' : 'register';
      const body = showLogin 
        ? { action, email, password }
        : { action, email, password, name };

      const response = await fetch(adminAuthUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(showLogin ? 'Успешный вход!' : 'Регистрация успешна!');
        onAuthSuccess(data.admin, data.token);
      } else {
        setMessage(data.error || 'Ошибка авторизации');
      }
    } catch (error) {
      setMessage('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {showLogin ? 'Вход в админ-панель' : 'Регистрация администратора'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!showLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">Имя</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Введите имя"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Пароль</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className={`text-sm ${message.includes('Ошибка') ? 'text-red-500' : 'text-green-500'}`}>
                {message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                showLogin ? 'Войти' : 'Зарегистрироваться'
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setShowLogin(!showLogin);
                setMessage('');
              }}
            >
              {showLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;
