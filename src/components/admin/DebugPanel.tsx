import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "warning" | "error" | "success";
  category: string;
  message: string;
  details?: any;
}

interface DebugPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

const DebugPanel = ({ logs, onClear }: DebugPanelProps) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    return log.level === filter;
  });

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      case "success":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  const getLevelIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "XCircle";
      case "warning":
        return "AlertTriangle";
      case "success":
        return "CheckCircle";
      default:
        return "Info";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon name="Bug" className="h-5 w-5" />
            Панель отладки
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClear}>
              <Icon name="Trash2" className="h-4 w-4 mr-2" />
              Очистить
            </Button>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Все ({logs.length})
          </Button>
          <Button
            variant={filter === "error" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setFilter("error")}
          >
            Ошибки ({logs.filter((l) => l.level === "error").length})
          </Button>
          <Button
            variant={filter === "warning" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("warning")}
          >
            Предупреждения ({logs.filter((l) => l.level === "warning").length})
          </Button>
          <Button
            variant={filter === "success" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("success")}
          >
            Успешно ({logs.filter((l) => l.level === "success").length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Icon name="FileText" className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Логи отсутствуют</p>
            </div>
          ) : (
            filteredLogs
              .slice()
              .reverse()
              .map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon
                        name={getLevelIcon(log.level)}
                        className={`h-5 w-5 mt-0.5 ${
                          log.level === "error"
                            ? "text-red-500"
                            : log.level === "warning"
                              ? "text-yellow-500"
                              : log.level === "success"
                                ? "text-green-500"
                                : "text-blue-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {log.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {log.timestamp.toLocaleTimeString("ru-RU")}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{log.message}</p>
                        {log.details && (
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpanded(expanded === log.id ? null : log.id)
                              }
                            >
                              <Icon
                                name={
                                  expanded === log.id ? "ChevronUp" : "ChevronDown"
                                }
                                className="h-4 w-4 mr-1"
                              />
                              {expanded === log.id ? "Скрыть" : "Подробнее"}
                            </Button>
                            {expanded === log.id && (
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
