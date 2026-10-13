export const obterDataHojeSaoPaulo = (agora = new Date()): string => {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(agora);
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((item) => item.type === tipo)?.value;
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
};

export const formatarDataEstudo = (data: string): string => {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
};
