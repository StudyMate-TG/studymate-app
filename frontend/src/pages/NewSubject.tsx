import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2 } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";

const colors = [
  { value: "#3b82f6", label: "Azul" },
  { value: "#22c55e", label: "Verde" },
  { value: "#a855f7", label: "Roxo" },
  { value: "#f97316", label: "Laranja" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#06b6d4", label: "Ciano" },
];

const NewSubject = () => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    professor: "",
    schedule: "",
    description: "",
    color: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-16">
        <MobileHeader title="Nova Disciplina" showBack />

        <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="p-4 rounded-full bg-green-500/20">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              Cadastro realizado com sucesso!
            </h2>

            <p className="text-muted-foreground">
              Disciplina cadastrada no protótipo.
            </p>
          </div>

          <Button
            onClick={() => navigate("/subjects")}
            className="w-full max-w-xs"
            size="lg"
          >
            Voltar às Disciplinas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <MobileHeader title="Nova Disciplina" showBack />

      <div className="px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Disciplina</Label>
                <Input
                  id="name"
                  placeholder="Digite o nome da disciplina"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="professor">Professor(a)</Label>
                <Input
                  id="professor"
                  placeholder="Digite o nome do professor"
                  value={formData.professor}
                  onChange={(e) =>
                    setFormData({ ...formData, professor: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Horário</Label>
                <Input
                  id="schedule"
                  placeholder="Digite o horário da disciplina"
                  value={formData.schedule}
                  onChange={(e) =>
                    setFormData({ ...formData, schedule: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Informações adicionais sobre a disciplina"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Cor da Disciplina</Label>

                <div className="grid grid-cols-6 gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-full aspect-square rounded-lg border-2 transition-all ${
                        formData.color === color.value
                          ? "border-foreground scale-110"
                          : "border-border"
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() =>
                        setFormData({ ...formData, color: color.value })
                      }
                      title={color.label}
                    />
                  ))}
                </div>

                {!formData.color && (
                  <p className="text-xs text-muted-foreground">
                    Selecione uma cor para identificar a disciplina.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/subjects")}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!formData.color}
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

export default NewSubject;