import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Clock, Plus, Trash2, Pencil } from "lucide-react";

import MobileHeader from "@/components/MobileHeader";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  excluirDisciplina,
  listarDisciplinas,
  type DisciplinaResponse,
} from "@/services/disciplinaService";

const Subjects = () => {
  const navigate = useNavigate();

  const [disciplinas, setDisciplinas] = useState<DisciplinaResponse[]>([]);
  const [termoBusca, setTermoBusca] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const carregarDisciplinas = async (termo?: string) => {
    setIsLoading(true);

    try {
      const dados = await listarDisciplinas(termo);
      setDisciplinas(dados);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao carregar disciplinas."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePesquisar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    carregarDisciplinas(termoBusca);
  };

  const handleLimparBusca = () => {
    setTermoBusca("");
    carregarDisciplinas();
  };

  const handleExcluir = async (idDisciplina: number) => {
    const confirmou = confirm("Deseja realmente excluir esta disciplina?");

    if (!confirmou) {
      return;
    }

    try {
      await excluirDisciplina(idDisciplina);
      carregarDisciplinas(termoBusca);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao excluir disciplina."
      );
    }
  };

  useEffect(() => {
    carregarDisciplinas();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <MobileHeader title="Disciplinas" />

      <div className="px-4 py-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold">Minhas Disciplinas</h2>
            <p className="text-sm text-muted-foreground">
              Cadastre, pesquise e gerencie suas disciplinas.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <form onSubmit={handlePesquisar} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  placeholder="Pesquisar por nome ou professor..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                >
                  Pesquisar
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLimparBusca}
                  disabled={isLoading}
                >
                  Limpar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Carregando disciplinas...
              </p>
            </CardContent>
          </Card>
        ) : disciplinas.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  Nenhuma disciplina encontrada
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
          disciplinas.map((disciplina) => (
            <Card
              key={disciplina.idDisciplina}
              className="hover:shadow-lg transition-all"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg">
                          {disciplina.nome}
                        </h3>

                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {disciplina.professor || "Professor não informado"}
                        </p>
                      </div>

                      <Badge variant="secondary" className="text-lg font-bold">
                        {disciplina.mediaAprovacao}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-muted-foreground text-xs">
                            Período
                          </p>
                          <p className="font-medium">
                            {disciplina.idPeriodo}
                          </p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-muted-foreground text-xs">
                            Limite de faltas
                          </p>
                          <p className="font-medium">
                            {disciplina.limiteFaltas}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ID da disciplina: {disciplina.idDisciplina}
                        </p>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/subjects/edit/${disciplina.idDisciplina}`)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleExcluir(disciplina.idDisciplina)
                          }
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Button
        onClick={() => navigate("/subject/new")}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default Subjects;