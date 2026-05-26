import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

type CalendarPreviewItem = {
  time: string;
  title: string;
  type: string;
  color: string;
};

type CalendarPreviewEvent = {
  date: string;
  items: CalendarPreviewItem[];
};

const CalendarPreview = () => {
  const events: CalendarPreviewEvent[] = [];

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Calendário Inteligente
          </h2>

          <p className="text-xl text-muted-foreground">
            Nunca mais perca um prazo ou compromisso importante
          </p>
        </div>

        {events.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6 text-center">
              <CalendarIcon className="w-8 h-8 text-primary mx-auto mb-3" />

              <h3 className="font-semibold text-lg">
                Nenhum evento cadastrado
              </h3>

              <p className="text-sm text-muted-foreground mt-1">
                A prévia do calendário será exibida após a integração com o
                backend.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {events.map((day, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    {day.date}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {day.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className={`w-1 rounded-full ${item.color}`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />

                          <span className="text-sm text-muted-foreground">
                            {item.time}
                          </span>
                        </div>

                        <p className="font-medium truncate">{item.title}</p>
                      </div>

                      <Badge variant="secondary" className="shrink-0 h-fit">
                        {item.type === "class"
                          ? "Aula"
                          : item.type === "exam"
                            ? "Prova"
                            : item.type === "deadline"
                              ? "Prazo"
                              : "Estudo"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="py-8">
              <h3 className="text-2xl font-bold mb-4">
                📅 Vista Mensal, Semanal ou Diária
              </h3>

              <p className="text-muted-foreground mb-4">
                Escolha a visualização que funciona melhor para você. Organize
                eventos acadêmicos, configure lembretes personalizados e acompanhe
                seus compromissos em um só lugar.
              </p>

              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline">Visualização mensal</Badge>
                <Badge variant="outline">Visualização semanal</Badge>
                <Badge variant="outline">Lembretes acadêmicos</Badge>
                <Badge variant="outline">Organização por disciplina</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CalendarPreview;