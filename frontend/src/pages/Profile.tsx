import type { ElementType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Bell,
  Moon,
  LogOut,
  ChevronRight,
  Settings,
  HelpCircle,
} from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { useNavigate } from "react-router-dom";

type MenuItem = {
  icon: ElementType;
  label: string;
  badge?: string;
};

const Profile = () => {
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    { icon: User, label: "Editar Perfil" },
    { icon: Bell, label: "Notificações" },
    { icon: Moon, label: "Modo Escuro" },
    { icon: Settings, label: "Configurações" },
    { icon: HelpCircle, label: "Ajuda e Suporte" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <MobileHeader title="Perfil" />

      <div className="px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">
              👨‍🎓
            </div>

            <h2 className="text-2xl font-bold mb-1">Perfil do estudante</h2>

            <p className="text-sm text-muted-foreground mb-4">
              Os dados do perfil serão exibidos após a integração com o backend.
            </p>

            <Button
              className="w-full bg-gradient-to-r from-primary to-accent"
              onClick={() => navigate("/profile/edit")}
            >
              Editar Perfil
            </Button>
          </CardContent>
        </Card>

        {/* Academic Info */}
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-bold mb-2">Informações Acadêmicas</h3>

            <p className="text-sm text-muted-foreground">
              Curso, semestre, matrícula e e-mail institucional serão carregados
              após a integração com o backend.
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-bold mb-2">Resumo acadêmico</h3>

            <p className="text-sm text-muted-foreground">
              Média geral, presença e tarefas concluídas serão exibidas quando
              houver dados cadastrados.
            </p>
          </CardContent>
        </Card>

        {/* Settings Menu */}
        <Card>
          <CardContent className="p-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  key={index}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-lg"
                  onClick={() => {
                    if (item.label === "Editar Perfil") {
                      navigate("/profile/edit");
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="text-xs bg-destructive text-destructive-foreground rounded-full px-2 py-0.5">
                        {item.badge}
                      </span>
                    )}

                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sair da Conta
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          StudyMate v1.0.0
        </p>
      </div>
    </div>
  );
};

export default Profile;