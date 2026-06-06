import { NavLink, useNavigate } from "react-router-dom";
import { Home, Calendar, Trophy, User, BookOpen, Plus, X, FileText, GraduationCap, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const MobileNav = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: "/home", icon: Home, label: "Início" },
    { path: "/subjects", icon: BookOpen, label: "Disciplinas" },
    { path: "/calendar", icon: Calendar, label: "Calendário" },
    { path: "/achievements", icon: Trophy, label: "Conquistas" },
    { path: "/profile", icon: User, label: "Perfil" },
  ];

  const quickActions = [
    { path: "/subjects/new", icon: GraduationCap, label: "Nova Disciplina", color: "bg-blue-500" },
    { path: "/tasks/new", icon: FileText, label: "Nova Tarefa", color: "bg-green-500" },
    { path: "/attendance/new", icon: ClipboardCheck, label: "Cadastrar Frequência", color: "bg-purple-500" },
  ];

  const handleQuickAction = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Overlay */}
      {isMenuOpen && (
        <div 
          className="absolute inset-0 bg-black/50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Quick Actions Menu */}
      {isMenuOpen && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 items-center">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => handleQuickAction(action.path)}
              className="flex items-center gap-3 bg-card px-4 py-3 rounded-full shadow-lg border border-border animate-fade-in"
            >
              <div className={cn("p-2 rounded-full text-white", action.color)}>
                <action.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* FAB Button */}
      <Button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={cn(
          "absolute bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-lg transition-transform",
          isMenuOpen && "rotate-45"
        )}
        size="icon"
      >
        {isMenuOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </Button>

      <nav className="absolute bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors rounded-lg",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
                  <span className="text-xs font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
