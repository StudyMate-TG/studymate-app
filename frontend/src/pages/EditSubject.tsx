import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

import {
  atualizarDisciplina,
  buscarDisciplinaPorId,
} from "@/services/disciplinaService";

const EditSubject = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(false);

  const [formularioDisciplina, setFormularioDisciplina] = useState({
    idPeriodo: 1,
    nome: "",
    professor: "",
    mediaAprovacao: 6,
    limiteFaltas: 20,
  });

  useEffect(() => {
    const carregarDisciplina = async () => {
      if (!id) {
        return;
      }

      setIsLoading(true);

      try {
        const disciplina = await buscarDisciplinaPorId(Number(id));

        setFormularioDisciplina({
          idPeriodo: disciplina.idPeriodo,
          nome: disciplina.nome,
          professor: disciplina.professor || "",
          mediaAprovacao: disciplina.mediaAprovacao,
          limiteFaltas: disciplina.limiteFaltas,
        });
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Erro ao carregar disciplina."
        );

        navigate("/subjects");
      } finally {
        setIsLoading(false);
      }
    };

    carregarDisciplina();
  }, [id, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!id) {
      alert("ID da disciplina não encontrado.");
      return;
    }

    if (!formularioDisciplina.nome.trim()) {
      alert("O nome da disciplina é obrigatório.");
      return;
    }

    setIsLoading(true);

    try {
      await atualizarDisciplina(Number(id), {
        idPeriodo: Number(formularioDisciplina.idPeriodo),
        nome: formularioDisciplina.nome,
        professor: formularioDisciplina.professor,
        mediaAprovacao: Number(formularioDisciplina.mediaAprovacao),
        limiteFaltas: Number(formularioDisciplina.limiteFaltas),
      });

      alert("Disciplina atualizada com sucesso!");
      navigate("/subjects");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar disciplina."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <MobileHeader title="Editar Disciplina" />

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
              <div className="space-y-2">
                <Label htmlFor="idPeriodo">ID do período</Label>
                <Input
                  id="idPeriodo"
                  type="number"
                  value={formularioDisciplina.idPeriodo}
                  onChange={(e) =>
                    setFormularioDisciplina({
                      ...formularioDisciplina,
                      idPeriodo: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome da disciplina</Label>
                <Input
                  id="nome"
                  type="text"
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
                {isLoading ? "Salvando..." : "Salvar alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditSubject;