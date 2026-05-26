import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Users, Clock, Plus } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { useNavigate } from "react-router-dom";

const Subjects = () => {
  const navigate = useNavigate();
  
  type Subject = {
    id: number;
    name: string;
    professor: string;
    schedule: string;
    grade: number;
    progress: number;
    color: string;
    attendance: string;
    nextClass: string;
  };

  const subjects: Subject[] = [];

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <MobileHeader title="Disciplinas" />

      <div className="px-4 py-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold">Minhas Disciplinas</h2>
          </div>
        </div>

    {subjects.length === 0 ? (
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <div>
            <h3 className="font-semibold text-lg">
              Nenhuma disciplina cadastrada
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              As disciplinas serão exibidas aqui após o cadastro.
            </p>
          </div>

          <Button onClick={() => navigate("/subjects/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar disciplina
          </Button>
        </CardContent>
      </Card>
    ) : (
      subjects.map((subject, index) => (
        <Card key={index} className="hover:shadow-lg transition-all">
          <CardContent className="p-4">
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-1 h-full rounded-full ${subject.color} absolute left-0 top-0 bottom-0`} />
              <div className="flex-1 pl-2">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{subject.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {subject.professor}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold">
                    {subject.grade}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progresso da disciplina</span>
                      <span className="font-semibold">{subject.progress}%</span>
                    </div>
                    <Progress value={subject.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-muted-foreground text-xs">Horário</p>
                      <p className="font-medium">{subject.schedule}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-muted-foreground text-xs">Presença</p>
                      <p className="font-medium">{subject.attendance}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Próxima aula: {subject.nextClass}
                    </p>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))
    )}
      
  </div>
      {/* Floating Action Button */}
      <Button
        onClick={() => navigate("/subjects/new")}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default Subjects;