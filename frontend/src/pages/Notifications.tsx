import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Clock, RefreshCw } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { chaveNotificacoes, useTotalNotificacoes } from "@/hooks/useNotificacoes";
import { listarNotificacoes, marcarNotificacaoLida } from "@/services/notificacaoService";
import { hasSession } from "@/services/apiClient";

type Filtro = "todas" | "nao-lidas" | "lidas";
const filtros: { value: Filtro; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "nao-lidas", label: "Não lidas" },
  { value: "lidas", label: "Lidas" },
];

const formatarData = (data: string) => new Date(data).toLocaleString("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
  timeStyle: "short",
});

const Notifications = () => {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [page, setPage] = useState(0);
  const [erroLeitura, setErroLeitura] = useState("");
  const queryClient = useQueryClient();
  const chave = chaveNotificacoes();
  const contagem = useTotalNotificacoes();
  const lida = filtro === "todas" ? undefined : filtro === "lidas";
  const historico = useQuery({
    queryKey: [...chave, "historico", filtro, page],
    queryFn: ({ signal }) => listarNotificacoes(page, lida, signal),
    enabled: hasSession(),
    refetchInterval: 60_000,
    retry: false,
  });
  useEffect(() => {
    if (historico.data && page > 0 && page >= historico.data.totalPages) {
      setPage(Math.max(0, historico.data.totalPages - 1));
    }
  }, [historico.data, page]);
  const leitura = useMutation({
    mutationFn: marcarNotificacaoLida,
    onMutate: () => setErroLeitura(""),
    onSuccess: async () => {
      // Reading the last item on a filtered page may remove that page.
      if (filtro === "nao-lidas" && page > 0 && historico.data?.content.length === 1) {
        setPage(page - 1);
      }
      await queryClient.invalidateQueries({ queryKey: chave });
    },
    onError: (error: Error) => setErroLeitura(error.message),
  });

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <MobileHeader title="Notificações" showBack />
      <div className="px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {contagem.isError ? "Contagem indisponível" : contagem.isPending ? "Carregando contagem…" : `${contagem.data} não lida${contagem.data !== 1 ? "s" : ""}`}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={historico.isFetching}
            onClick={() => { void queryClient.invalidateQueries({ queryKey: chave }); }}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${historico.isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
        <div className="flex gap-2" aria-label="Filtrar notificações">
          {filtros.map((item) => (
            <Button
              key={item.value}
              variant={filtro === item.value ? "default" : "outline"}
              size="sm"
              aria-pressed={filtro === item.value}
              onClick={() => { setFiltro(item.value); setPage(0); setErroLeitura(""); }}
            >{item.label}</Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Histórico de avisos acadêmicos. Horários de Brasília (São Paulo).</p>
        {erroLeitura && <p role="alert" className="text-sm text-destructive">{erroLeitura}</p>}
        {historico.isPending ? (
          <p role="status" className="py-8 text-center text-muted-foreground">Carregando notificações…</p>
        ) : historico.isError ? (
          <Card><CardContent className="p-5 space-y-3">
            <p role="alert" className="text-sm text-destructive">{historico.error.message || "Não foi possível carregar as notificações."}</p>
            <Button variant="outline" onClick={() => { void historico.refetch(); }}>Tentar novamente</Button>
          </CardContent></Card>
        ) : historico.data.content.length === 0 ? (
          <Card><CardContent className="p-8 text-center space-y-2">
            <Bell className="w-8 h-8 mx-auto text-muted-foreground" />
            <h2 className="font-semibold">{filtro === "nao-lidas" ? "Nenhuma notificação não lida" : "Nenhuma notificação neste filtro"}</h2>
            <p className="text-sm text-muted-foreground">Os avisos sobre tarefas, avaliações, faltas e média aparecerão aqui.</p>
          </CardContent></Card>
        ) : (
          <ul className="space-y-3">
            {historico.data.content.map((notificacao) => (
              <li key={notificacao.idNotificacao}>
                <Card className={notificacao.lida ? "" : "border-primary/40 bg-primary/5"}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold break-words min-w-0">{notificacao.titulo}</h2>
                      <Badge variant={notificacao.lida ? "secondary" : "default"} className="shrink-0">{notificacao.lida ? "Lida" : "Não lida"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line break-words">{notificacao.mensagem}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      <time dateTime={notificacao.processadoEm}>{formatarData(notificacao.processadoEm)}</time>
                    </p>
                    {!notificacao.lida && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={leitura.isPending}
                        onClick={() => leitura.mutate(notificacao.idNotificacao)}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {leitura.isPending && leitura.variables === notificacao.idNotificacao ? "Marcando…" : "Marcar como lida"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
        {historico.data && historico.data.totalPages > 1 && (
          <nav className="flex items-center justify-between gap-2" aria-label="Páginas de notificações">
            <Button variant="outline" size="sm" disabled={page === 0 || historico.isFetching} onClick={() => setPage(page - 1)}>Anterior</Button>
            <span className="text-xs text-muted-foreground">Página {page + 1} de {historico.data.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page + 1 >= historico.data.totalPages || historico.isFetching} onClick={() => setPage(page + 1)}>Próxima</Button>
          </nav>
        )}
      </div>
    </div>
  );
};

export default Notifications;
