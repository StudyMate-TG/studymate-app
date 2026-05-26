import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";

type SubjectOption = {
  id: string;
  name: string;
};

const NewTask = () => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    dueDate: "",
    priority: "medium",
    description: "",
  });

  const subjects: SubjectOption[] = [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-16">
        <MobileHeader title="Nova Tarefa" showBack />

        <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="p-4 rounded-full bg-green-500/20">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              Cadastro realizado com sucesso!
            </h2>

            <p className="text-muted-foreground">
              A tarefa foi cadastrada no protótipo.
            </p>
          </div>

          <Button
            onClick={() => navigate("/calendar")}
            className="w-full max-w-xs"
            size="lg"
          >
            Voltar ao Calendário
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <MobileHeader title="Nova Tarefa" showBack />

      <div className="px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Tarefa</Label>
                <Input
                  id="title"
                  placeholder="Ex: Entrega do trabalho"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Disciplina</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subject: value })
                  }
                  required
                  disabled={subjects.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma disciplina" />
                  </SelectTrigger>

                  <SelectContent>
                    {subjects.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Nenhuma disciplina cadastrada
                      </SelectItem>
                    ) : (
                      subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {subjects.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Cadastre uma disciplina antes de criar uma tarefa.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Entrega</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="low">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Baixa
                      </span>
                    </SelectItem>

                    <SelectItem value="medium">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        Média
                      </span>
                    </SelectItem>

                    <SelectItem value="high">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Alta
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Detalhes sobre a tarefa"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/calendar")}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  className="flex-1"
                  disabled={subjects.length === 0}
                >
                  Cadastrar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewTask;