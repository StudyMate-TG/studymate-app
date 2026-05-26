import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Book, Clock, CalendarClock, ChevronRight, Plus, Trophy } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { useNavigate } from "react-router-dom";
import type { ElementType } from "react";

const Home = () => {
  const navigate = useNavigate();

  type DashboardStat = {
    label: string;
    value: string | number;
    icon?: ElementType;
    color?: string;
  }

  const stats: DashboardStat[] = [];

  type UpcomingTask = {
    id: number;
    title: string;
    subject: string;
    date: string;
    urgent: boolean;
  }

  const upcomingTasks: UpcomingTask[] = [];

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <MobileHeader title="StudyMate" />

      <div className="px-4 py-6 space-y-6">

        {/* card bem-vindo */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl">
                👨‍🎓
              </div>
              <div>
                <h2 className="text-xl font-bold">Bem-vindo ao StudyMate!</h2>
                <p className="text-sm text-muted-foreground">Seu progresso será exibido futuramente...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* card resumo rápido - estatísticas */}
        {stats.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                O resumo acadêmico será exibido após integração com backend.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;

              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {Icon && <Icon className={`w-6 h-6 mb-2 ${stat.color ?? ""}`} />}
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}


        {/* card sequência de estudos */}
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🔥</div>
              <div>
                <p className="font-bold text-lg">Sequência de estudos</p>
                <p className="text-sm text-muted-foreground">
                  Sua sequência será exibida após a integração com o backend.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* proximas tarefas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Próximas Entregas</h3>
            <button 
              className="text-primary text-sm font-medium flex items-center"
              onClick={() => navigate("/calendar")}
            >
              Ver todas
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma entrega próxima cadastrada.
                  </p>
                </CardContent>
              </Card>
            ) : (
              upcomingTasks.map((task, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{task.title}</h4>

                          {task.urgent && (
                            <Badge variant="destructive" className="text-xs">
                              Urgente
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-1">
                          {task.subject}
                        </p>

                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.date}
                        </p>
                      </div>

                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={() => navigate("/tasks/new")}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default Home;