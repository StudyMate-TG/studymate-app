import { Bell, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import logo from "@/assets/logo.png";

type NotificationViewModel = {
  id: number;
  title: string;
  description: string;
  type: string;
  sentAt: string;
  read: boolean;
};

type MobileHeaderProps = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
};

const MobileHeader = ({ title, showBack, onBack }: MobileHeaderProps) => {
  const navigate = useNavigate();

  const notifications: NotificationViewModel[] = [];

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/");
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <header className="absolute top-0 left-0 right-0 z-40 bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3">
          {showBack ? (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : (
            <img
              src={logo}
              alt="StudyMate"
              className="w-12 h-12 object-contain"
            />
          )}

          <h1 className="text-lg font-bold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />

                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-destructive text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="w-80 p-0 bg-card border border-border"
              align="end"
            >
              <div className="p-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Notificações</h3>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Nenhuma notificação no momento.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-border last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                        !notification.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!notification.read && (
                          <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                        )}

                        <div
                          className={`flex-1 ${
                            notification.read ? "ml-5" : ""
                          }`}
                        >
                          <p className="font-medium text-sm text-foreground">
                            {notification.title}
                          </p>

                          <p className="text-xs text-muted-foreground mt-0.5">
                            {notification.description}
                          </p>

                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {notification.sentAt}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-border">
                <Button variant="ghost" className="w-full text-sm text-primary">
                  Ver todas as notificações
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;