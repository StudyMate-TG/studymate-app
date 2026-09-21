import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

import { cadastrarDisciplina } from "@/services/disciplinaService";

const NewSubject = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formularioDisciplina, setFormularioDisciplina] = useState({
    nome: "",
    professor: "",
    mediaAprovacao: 6,
    limiteFaltas: 20,
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formularioDisciplina.nome.trim()) {
      alert("O nome da disciplina é obrigatório.");
      return;
    }

    setIsLoading(true);

    try {
      await cadastrarDisciplina({
        nome: formularioDisciplina.nome,
        professor: formularioDisciplina.professor,
        mediaAprovacao: Number(formularioDisciplina.mediaAprovacao),
        limiteFaltas: Number(formularioDisciplina.limiteFaltas),
      });

      alert("Disciplina cadastrada com sucesso!");
      navigate("/subjects");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar disciplina."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <MobileHeader title="Nova Disciplina" />

      <div className="px-4 py-6 space-y-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/subjects")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">A disciplina será vinculada ao seu período ativo. Se necessário, um período será criado automaticamente.</p>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome da disciplina</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Ex: Banco de Dados"
                  value={formularioDisciplina.nome}
                  onChange={(e) =>
                    setFormularioDisciplina({
                      ...formularioDisciplina,
                      nome: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="professor">Professor</Label>
                <Input
                  id="professor"
                  type="text"
                  placeholder="Ex: Prof. Carlos"
                  value={formularioDisciplina.professor}
                  onChange={(e) =>
                    setFormularioDisciplina({
                      ...formularioDisciplina,
                      professor: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mediaAprovacao">Média de aprovação</Label>
                <Input
                  id="mediaAprovacao"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formularioDisciplina.mediaAprovacao}
                  onChange={(e) =>
                    setFormularioDisciplina({
                      ...formularioDisciplina,
                      mediaAprovacao: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="limiteFaltas">Limite de faltas</Label>
                <Input
                  id="limiteFaltas"
                  type="number"
                  min="0"
                  value={formularioDisciplina.limiteFaltas}
                  onChange={(e) =>
                    setFormularioDisciplina({
                      ...formularioDisciplina,
                      limiteFaltas: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Salvando..." : "Salvar disciplina"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewSubject;