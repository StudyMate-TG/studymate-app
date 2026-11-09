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

export const formatarEntradaData = (
  valor: string
): string => {
  const numeros = valor
    .replace(/\D/g, "")
    .slice(0, 8);

  if (numeros.length <= 2) {
    return numeros;
  }

  if (numeros.length <= 4) {
    return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  }

  return `${numeros.slice(0, 2)}/${numeros.slice(
    2,
    4
  )}/${numeros.slice(4)}`;
};

export const converterDataParaApi = (
  data: string
): string | null => {
  const match = data.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/
  );

  if (!match) {
    return null;
  }

  const [, dia, mes, ano] = match;

  const diaNumero = Number(dia);
  const mesNumero = Number(mes);
  const anoNumero = Number(ano);

  const dataObj = new Date(
    anoNumero,
    mesNumero - 1,
    diaNumero
  );

  if (
    dataObj.getFullYear() !== anoNumero ||
    dataObj.getMonth() !== mesNumero - 1 ||
    dataObj.getDate() !== diaNumero
  ) {
    return null;
  }

  return `${ano}-${mes}-${dia}`;
};