import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type DashboardStat = {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
};

type DashboardSubject = {
  name: string;
  grade: number;
  progress: number;
  color: string;
};

type UpcomingTask = {
  title: string;
  date: string;
  type: string;
};

const Dashboard = () => {
  const stats: DashboardStat[] = [];

  const subjects: DashboardSubject[] = [];

  const upcomingTasks: UpcomingTask[] = [];

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Seu Dashboard Acadêmico
          </h2>

          <p className="text-xl text-muted-foreground">
            Acompanhe seu desempenho em tempo real
          </p>
        </div>

        {stats.length === 0 ? (
          <Card className="mb-8">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                As estatísticas do dashboard serão exibidas após a integração
                com o backend.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatsCard
                key={index}
                icon={stat.icon}
                title={stat.title}
                value={stat.value}
                subtitle={stat.subtitle}
              />
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Disciplinas Ativas</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  Nenhuma disciplina cadastrada.
                </p>
              ) : (
                subjects.map((subject, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${subject.color}`}
                        />

                        <span className="font-medium">{subject.name}</span>
                      </div>

                      <Badge variant="secondary">
                        Nota: {subject.grade}
                      </Badge>
                    </div>

                    <Progress value={subject.progress} className="h-2" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximas Entregas</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  Nenhuma entrega próxima cadastrada.
                </p>
              ) : (
                upcomingTasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.date}
                      </p>
                    </div>

                    <Badge
                      variant={
                        task.type === "exam" ? "destructive" : "default"
                      }
                    >
                      {task.type === "exam"
                        ? "Prova"
                        : task.type === "assignment"
                          ? "Trabalho"
                          : "Exercício"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

const StatsCard = ({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
}) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="pt-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>

        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default Dashboard;