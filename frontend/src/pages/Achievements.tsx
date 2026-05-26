import type { ElementType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";

type AchievementStat = {
  label: string;
  value: string | number;
  icon?: ElementType;
  color?: string;
};

type AchievementBadge = {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
};

const Achievements = () => {
  const stats: AchievementStat[] = [];

  const badges: AchievementBadge[] = [];

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <MobileHeader title="Conquistas" />

      <div className="px-4 py-6 space-y-6">
        {/* Level Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-primary" />

              <div>
                <h2 className="text-2xl font-bold">Progresso do estudante</h2>
                <p className="text-sm text-muted-foreground">
                  Nível e XP serão exibidos após a integração com o backend.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="text-5xl">🔥</div>

            <div className="flex-1">
              <h3 className="text-xl font-bold">Sequência de estudos</h3>
              <p className="text-sm text-muted-foreground">
                Sua sequência será exibida após a integração com o backend.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        {stats.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                O resumo de conquistas será exibido após a integração com o
                backend.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;

              return (
                <Card key={index}>
                  <CardContent className="p-4 text-center">
                    {Icon && (
                      <Icon
                        className={`w-6 h-6 mx-auto mb-2 ${
                          stat.color ?? ""
                        }`}
                      />
                    )}

                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Badges */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Badges conquistados</h3>

            {badges.length > 0 && (
              <Badge variant="secondary">
                {badges.filter((badge) => badge.unlocked).length}/
                {badges.length}
              </Badge>
            )}
          </div>

          {badges.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-lg">
                  Nenhuma conquista cadastrada
                </h3>

                <p className="text-sm text-muted-foreground mt-1">
                  As conquistas serão exibidas aqui conforme o estudante avançar
                  no sistema.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {badges.map((badge) => (
                <Card
                  key={badge.id}
                  className={`transition-all ${
                    badge.unlocked
                      ? "border-primary/50 bg-primary/5 shadow-md"
                      : "opacity-60 bg-muted/30"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-5xl mb-2">{badge.icon}</div>

                      <h4 className="font-semibold mb-1 text-sm">
                        {badge.name}
                      </h4>

                      <p className="text-xs text-muted-foreground mb-2">
                        {badge.description}
                      </p>

                      {badge.unlocked ? (
                        <Badge className="w-full justify-center bg-gradient-to-r from-primary to-accent text-xs">
                          {badge.unlockedAt ?? "Conquistado"}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="w-full justify-center text-xs"
                        >
                          Em progresso
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Progress Insights */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Seu progresso
            </h3>

            <p className="text-sm text-muted-foreground">
              Indicadores de progresso serão exibidos após a integração com o
              backend.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Achievements;