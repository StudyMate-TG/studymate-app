import { Bell, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useTotalNotificacoes } from "@/hooks/useNotificacoes";
import logo from "@/assets/logo.png";

type MobileHeaderProps = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
};

const MobileHeader = ({ title, showBack, onBack }: MobileHeaderProps) => {
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useTotalNotificacoes();

  return (
    <header className="absolute top-0 left-0 right-0 z-40 bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3">
          {showBack ? (
            <Button variant="ghost" size="icon" aria-label="Voltar" onClick={onBack ?? (() => navigate("/home"))}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : (
            <img src={logo} alt="StudyMate" className="w-12 h-12 object-contain" />
          )}
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ""}`}
          onClick={() => navigate("/notifications")}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center bg-destructive text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
};

export default MobileHeader;
