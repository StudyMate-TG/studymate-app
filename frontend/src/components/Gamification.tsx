import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Zap, Award, Star } from "lucide-react";

type GamificationBadge = {
  id: number;
  name: string;
  icon: string;
  earned: boolean;
  description: string;
};

type GamificationStat = {
  label: string;
  value: string;
};

const Gamification = () => {
  const badges: GamificationBadge[] = [];

  const stats: GamificationStat[] = [];

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Sistema de Recompensas
          </h2>

          <p className="text-xl text-muted-foreground">
            Evolua, conquiste badges e suba de nível!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Suas Conquistas
              </CardTitle>
            </CardHeader>

            <CardContent>
              {badges.length === 0 ? (
                <EmptyState
                  icon={<Trophy className="w-8 h-8 text-primary" />}
                  title="Nenhuma conquista cadastrada"
                  description="As conquistas serão exibidas após a integração com o backend."
                />
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        badge.earned
                          ? "border-primary bg-primary/5 shadow-badge"
                          : "border-border bg-muted/30 opacity-60"
                      }`}
                    >
                      <div className="text-4xl mb-2 text-center">
                        {badge.icon}
                      </div>

                      <h4 className="font-semibold text-center mb-1">
                        {badge.name}
                      </h4>

                      <p className="text-xs text-muted-foreground text-center">
                        {badge.description}
                      </p>

                      {badge.earned && (
                        <Badge className="w-full mt-2 justify-center bg-gradient-to-r from-primary to-accent">
                          Conquistado!
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Seu Nível
                </CardTitle>
              </CardHeader>

              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Nível e XP serão exibidos após a integração com o backend.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent" />
                  Sequência Atual
                </CardTitle>
              </CardHeader>

              <CardContent className="text-center">
                <div className="text-5xl mb-2">🔥</div>

                <p className="text-sm text-muted-foreground">
                  Sua sequência será exibida após a integração com o backend.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Estatísticas
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {stats.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">
                    As estatísticas serão exibidas quando houver dados
                    cadastrados.
                  </p>
                ) : (
                  stats.map((stat, index) => (
                    <StatRow
                      key={index}
                      label={stat.label}
                      value={stat.value}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

const EmptyState = ({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) => (
  <div className="p-6 text-center">
    <div className="flex justify-center mb-3">{icon}</div>

    <h3 className="font-semibold text-lg">{title}</h3>

    <p className="text-sm text-muted-foreground mt-1">{description}</p>
  </div>
);

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground">{value}</span>
  </div>
);

export default Gamification;