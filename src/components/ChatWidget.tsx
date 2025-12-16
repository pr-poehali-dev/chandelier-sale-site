import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const CHAT_API = 'https://functions.poehali.dev/d551e786-cb55-48fa-93a9-271785689233';

interface Message {
  id: number;
  sender_type: 'user' | 'admin';
  message: string;
  created_at: string;
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      // Блокируем прокрутку body когда чат открыт
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      // Возвращаем прокрутку когда чат закрыт
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && sessionId) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, sessionId]);

  const getUserId = () => {
    let userId = localStorage.getItem('chat_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_user_id', userId);
    }
    return userId;
  };

  const startChat = async () => {
    if (!userName.trim()) {
      toast({
        title: 'Введите ваше имя',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const userId = getUserId();
      const response = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_session',
          user_id: userId,
          user_name: userName,
          user_email: userEmail,
        }),
      });

      const data = await response.json();
      setSessionId(data.session_id);
      setIsStarted(true);
      await loadMessages();
    } catch (error) {
      toast({
        title: 'Ошибка подключения',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`${CHAT_API}?action=get_messages&session_id=${sessionId}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;

    const messageText = inputMessage;
    setInputMessage('');

    try {
      await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          session_id: sessionId,
          sender_type: 'user',
          message: messageText,
        }),
      });

      await loadMessages();
    } catch (error) {
      toast({
        title: 'Ошибка отправки',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <Icon name="MessageCircle" className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-96 h-[500px] max-h-[calc(100vh-2rem)] shadow-xl z-50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <CardTitle className="text-lg">Онлайн-консультант</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <Icon name="X" className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {!isStarted ? (
              <div className="flex-1 flex flex-col justify-center p-6 space-y-4">
                <div className="text-center mb-4">
                  <Icon name="MessageCircle" className="h-12 w-12 mx-auto text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Начните чат</h3>
                  <p className="text-sm text-muted-foreground">
                    Представьтесь, чтобы мы могли помочь вам
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Ваше имя *</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Введите имя"
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                    onKeyPress={(e) => e.key === 'Enter' && startChat()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email (опционально)</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                    onKeyPress={(e) => e.key === 'Enter' && startChat()}
                  />
                </div>

                <Button onClick={startChat} disabled={loading} className="w-full">
                  {loading ? 'Подключение...' : 'Начать чат'}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      Напишите ваш вопрос
                    </div>
                  )}
                  
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          msg.sender_type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Введите сообщение..."
                      className="flex-1 px-4 py-2 rounded-lg border bg-background"
                    />
                    <Button onClick={sendMessage} size="icon">
                      <Icon name="Send" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ChatWidget;