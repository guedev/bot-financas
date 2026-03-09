const dayjs = require("dayjs");

function gerarParcelas(valorTotal, totalParcelas) {
  const valorBase = Math.floor((valorTotal / totalParcelas) * 100) / 100;
  const parcelas = [];
  let soma = 0;

  for (let i = 1; i <= totalParcelas; i++) {
    if (i === totalParcelas) {
      parcelas.push(Number((valorTotal - soma).toFixed(2)));
    } else {
      parcelas.push(valorBase);
      soma += valorBase;
    }
  }

  return parcelas;
}

function gerarFaturas(primeiraFatura, totalParcelas) {
  const faturas = [];
  let data = dayjs(primeiraFatura);

  for (let i = 0; i < totalParcelas; i++) {
    faturas.push(data.format("YYYY-MM"));
    data = data.add(1, "month");
  }

  return faturas;
}

function parseBRL(v) {
  if (!v) return 0;
  return Number(String(v).replace(".", "").replace(",", ".")) || 0;
}

module.exports = { gerarParcelas, gerarFaturas };