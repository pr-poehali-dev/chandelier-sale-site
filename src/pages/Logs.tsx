import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useCart } from '@/contexts/CartContext';

interface LogEntry {
  timestamp: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
}

const Logs = () => {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    const captureLog = (level: LogEntry['level']) => (...args: any[]) => {
      if (!isPaused) {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');

        const entry: LogEntry = {
          timestamp: new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            fractionalSecondDigits: 3 
          }),
          level,
          source: 'frontend',
          message,
        };

        setLogs(prev => [...prev.slice(-999), entry]);
      }

      originalConsole[level](...args);
    };

    console.log = captureLog('log');
    console.info = captureLog('info');
    console.warn = captureLog('warn');
    console.error = captureLog('error');
    console.debug = captureLog('debug');

    return () => {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.debug = originalConsole.debug;
    };
  }, [isPaused]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (!logsContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    setAutoScroll(isAtBottom);
  };

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'bg-red-500';
      case 'warn': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      case 'debug': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'XCircle';
      case 'warn': return 'AlertTriangle';
      case 'info': return 'Info';
      case 'debug': return 'Bug';
      default: return 'FileText';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        cartItemsCount={totalItems}
        onCartClick={() => navigate('/cart')}
        onAuthClick={() => {}}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Icon name="Activity" className="h-8 w-8" />
              Живые логи
            </h1>
            <p className="text-muted-foreground mt-1">
              Мониторинг системных событий в реальном времени
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={isPaused ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
            >
              <Icon name={isPaused ? 'Play' : 'Pause'} className="h-4 w-4 mr-2" />
              {isPaused ? 'Возобновить' : 'Пауза'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLogs([])}
            >
              <Icon name="Trash2" className="h-4 w-4 mr-2" />
              Очистить
            </Button>
          </div>
        </div>

        <Card className="p-4 mb-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Поиск по логам..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Уровень" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все уровни</SelectItem>
                <SelectItem value="log">Log</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {filteredLogs.length} записей
              </Badge>
              {!autoScroll && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAutoScroll(true);
                    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Icon name="ArrowDown" className="h-4 w-4 mr-1" />
                  Вниз
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div
            ref={logsContainerRef}
            onScroll={handleScroll}
            className="h-[calc(100vh-350px)] overflow-y-auto bg-slate-950 text-slate-100 font-mono text-sm"
          >
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Icon name="Terminal" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Нет логов для отображения</p>
                  <p className="text-xs mt-1">
                    {isPaused ? 'Снимите паузу для захвата логов' : 'Логи появятся здесь автоматически'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-1">
                {filteredLogs.map((log, index) => (
                  <div
                    key={index}
                    className="flex gap-3 hover:bg-slate-900 px-2 py-1 rounded transition-colors"
                  >
                    <span className="text-slate-500 shrink-0">
                      {log.timestamp}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`w-1.5 h-1.5 rounded-full ${getLevelColor(log.level)}`} />
                      <Icon 
                        name={getLevelIcon(log.level) as any} 
                        className="h-3.5 w-3.5 text-slate-400" 
                      />
                    </div>
                    <span className={`uppercase shrink-0 text-xs font-semibold ${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warn' ? 'text-yellow-400' :
                      log.level === 'info' ? 'text-blue-400' :
                      log.level === 'debug' ? 'text-purple-400' :
                      'text-slate-400'
                    }`}>
                      [{log.level}]
                    </span>
                    <span className="text-slate-300 break-all">
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </Card>

        <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex gap-4">
            <span>📊 Всего: {logs.length}</span>
            <span className="text-red-400">❌ Ошибок: {logs.filter(l => l.level === 'error').length}</span>
            <span className="text-yellow-400">⚠️ Предупреждений: {logs.filter(l => l.level === 'warn').length}</span>
          </div>
          <div>
            {autoScroll && <span className="text-green-400">● Автопрокрутка активна</span>}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Logs;
