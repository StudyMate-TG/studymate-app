export function formatarPrioridade(
  prioridade?: string | null
): string {
  const valor =
    prioridade
      ?.trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  switch (valor) {
    case "LOW":
    case "BAIXA":
      return "BAIXA";

    case "MEDIUM":
    case "MEDIA":
      return "MÉDIA";

    case "HIGH":
    case "ALTA":
      return "ALTA";

    default:
      return prioridade || "Não informada";
  }
}