import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: any;
}

const LiveDebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };

    const addLog = (level: LogEntry['level'], message: string, details?: any) => {
      const log: LogEntry = {
        id: Date.now().toString() + Math.random(),
        timestamp: new Date().toLocaleTimeString('ru-RU'),
        level,
        message,
        details,
      };
      setLogs(prev => [...prev.slice(-49), log]);
    };

    console.log = (...args) => {
      originalConsole.log(...args);
      addLog('info', args.join(' '), args.length > 1 ? args : undefined);
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      addLog('warn', args.join(' '), args.length > 1 ? args : undefined);
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      addLog('error', args.join(' '), args.length > 1 ? args : undefined);
    };

    window.addEventListener('error', (event) => {
      addLog('error', `Global error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
      });
    });

    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const clearLogs = () => setLogs([]);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warn': return 'text-yellow-600';
      case 'success': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'XCircle';
      case 'warn': return 'AlertTriangle';
      case 'success': return 'CheckCircle';
      default: return 'Info';
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        size="lg"
      >
        <Icon name="Bug" className="mr-2 h-5 w-5" />
        Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] h-96 z-50 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Icon name="Terminal" className="h-5 w-5" />
          <h3 className="font-semibold">Live Logs</h3>
          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
            {logs.length}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={clearLogs}>
            <Icon name="Trash2" className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <Icon name="X" className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-900 text-white font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Icon name="Search" className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Логов пока нет</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="flex gap-2 items-start">
              <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
              <Icon 
                name={getLevelIcon(log.level)} 
                className={`h-4 w-4 flex-shrink-0 mt-0.5 ${getLevelColor(log.level)}`}
              />
              <div className="flex-1 break-words">
                <p className={getLevelColor(log.level)}>{log.message}</p>
                {log.details && (
                  <pre className="text-gray-400 text-[10px] mt-1 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </Card>
  );
};

export default LiveDebugPanel;
