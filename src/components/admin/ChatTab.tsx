import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const CHAT_API = 'https://functions.poehali.dev/d551e786-cb55-48fa-93a9-271785689233';

interface ChatSession {
  id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface Message {
  id: number;
  sender_type: 'user' | 'admin';
  message: string;
  created_at: string;
}

const ChatTab = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSession) {
      markAsRead(selectedSession.id);
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const response = await fetch(`${CHAT_API}?action=get_sessions&status=active`);
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedSession) return;

    try {
      const response = await fetch(`${CHAT_API}?action=get_messages&session_id=${selectedSession.id}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedSession) return;

    const messageText = inputMessage;
    setInputMessage('');

    try {
      await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          session_id: selectedSession.id,
          sender_type: 'admin',
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

  const markAsRead = async (sessionId: number) => {
    try {
      await fetch(CHAT_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          session_id: sessionId,
        }),
      });
      await loadSessions();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const closeSession = async (sessionId: number) => {
    try {
      await fetch(CHAT_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close_session',
          session_id: sessionId,
        }),
      });

      toast({
        title: 'Чат закрыт',
      });

      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }

      await loadSessions();
    } catch (error) {
      toast({
        title: 'Ошибка',
        variant: 'destructive',
      });
    }
  };

  const deleteSession = async (sessionId: number) => {
    if (!confirm('Удалить этот чат и все сообщения?')) return;

    try {
      await fetch(`${CHAT_API}?session_id=${sessionId}`, {
        method: 'DELETE',
      });

      toast({
        title: 'Чат удалён',
      });

      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }

      await loadSessions();
    } catch (error) {
      toast({
        title: 'Ошибка удаления',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Загрузка чатов...</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
      <Card className="md:col-span-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Icon name="MessageCircle" className="h-5 w-5" />
            Активные чаты ({sessions.length})
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Icon name="MessageCircle" className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Нет активных чатов</p>
            </div>
          ) : (
            <div className="divide-y">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full p-4 text-left hover:bg-muted transition-colors ${
                    selectedSession?.id === session.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium">{session.user_name || 'Гость'}</p>
                      {session.user_email && (
                        <p className="text-sm text-muted-foreground">{session.user_email}</p>
                      )}
                    </div>
                    {session.message_count > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {session.message_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.created_at).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="md:col-span-2 flex flex-col overflow-hidden">
        {selectedSession ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedSession.user_name || 'Гость'}</h3>
                {selectedSession.user_email && (
                  <p className="text-sm text-muted-foreground">{selectedSession.user_email}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => closeSession(selectedSession.id)}
                >
                  <Icon name="X" className="h-4 w-4 mr-2" />
                  Закрыть
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteSession(selectedSession.id)}
                >
                  <Icon name="Trash2" className="h-4 w-4 mr-2" />
                  Удалить
                </Button>
              </div>
            </div>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Начните диалог с клиентом
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      msg.sender_type === 'admin'
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
            </CardContent>

            <div className="p-4 border-t">
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
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Icon name="MessageCircle" className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Выберите чат для начала общения</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ChatTab;