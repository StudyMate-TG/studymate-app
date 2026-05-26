import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";

type CalendarEvent = {
  time: string;
  title: string;
  type: string;
  color: string;
};

type CalendarDayEvents = {
  day: string;
  date: string;
  items: CalendarEvent[];
};

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const events: CalendarDayEvents[] = [];

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      class: "Aula",
      exam: "Prova",
      deadline: "Prazo",
      study: "Estudo",
    };

    return labels[type] || type;
  };

  const monthLabel = useMemo(() => {
    return selectedDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  const weekDays = useMemo(() => {
    const baseDate = new Date(selectedDate);
    const currentDay = baseDate.getDay();

    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - currentDay);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);

      return {
        dayNumber: date.getDate().toString().padStart(2, "0"),
        dayName: date
          .toLocaleDateString("pt-BR", { weekday: "short" })
          .replace(".", "")
          .toUpperCase(),
        isSelected:
          date.toDateString() === selectedDate.toDateString(),
      };
    });
  }, [selectedDate]);

  const goToPreviousMonth = () => {
    setSelectedDate((currentDate) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setSelectedDate((currentDate) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + 1);
      return newDate;
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <MobileHeader title="Calendário" />

      <div className="px-4 py-6 space-y-6">
        {/* Month Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="text-center">
                <h2 className="text-lg font-bold capitalize">{monthLabel}</h2>
                <p className="text-sm text-muted-foreground">
                  Eventos acadêmicos
                </p>
              </div>

              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Week View */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weekDays.map((day, index) => (
            <button
              key={index}
              className={`flex flex-col items-center justify-center min-w-[60px] h-16 rounded-lg transition-all ${
                day.isSelected
                  ? "bg-primary text-primary-foreground shadow-lg scale-105"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <span className="text-xs font-medium opacity-80">
                {day.dayName}
              </span>
              <span className="text-lg font-bold">{day.dayNumber}</span>
            </button>
          ))}
        </div>

        {/* Today's Summary */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Resumo do calendário</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              Os eventos acadêmicos serão exibidos após a integração com o
              backend.
            </p>
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="space-y-6">
          {events.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum evento cadastrado no calendário.
                </p>
              </CardContent>
            </Card>
          ) : (
            events.map((dayEvents, dayIndex) => (
              <div key={dayIndex}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground font-medium">
                      {dayEvents.day}
                    </p>
                    <p className="text-2xl font-bold">{dayEvents.date}</p>
                  </div>

                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-3">
                  {dayEvents.items.map((item, itemIndex) => (
                    <Card
                      key={itemIndex}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div
                            className={`w-1 h-full rounded-full ${item.color} absolute left-0 top-0 bottom-0`}
                          />

                          <div className="flex-1 pl-2">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">{item.title}</h4>

                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3" />
                                  {item.time}
                                </p>
                              </div>

                              <Badge
                                variant={
                                  item.type === "exam" ||
                                  item.type === "deadline"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {getTypeLabel(item.type)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;