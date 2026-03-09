require("dotenv").config();
const { Telegraf } = require("telegraf");
const dayjs = require("dayjs");
const { addRow, getAllRows } = require("./sheets");
const { gerarParcelas, gerarFaturas } = require("./utils");

const bot = new Telegraf(process.env.BOT_TOKEN);
const usuariosAutenticados = {};
const lancamentosEmAndamento = {};

function isAutenticado(userId) {

  const hoje = new Date().toISOString().slice(0,10);

  if (!usuariosAutenticados[userId]) return false;

  return usuariosAutenticados[userId] === hoje;
}

bot.use((ctx, next) => {

  const userId = ctx.from.id.toString();
  const allowedUser = process.env.ALLOWED_USER_ID;

  if (userId !== allowedUser) {
    console.log("Acesso bloqueado:", userId);
    return; // ignora completamente
  }

  return next();

});

bot.command("login", async (ctx) => {

  const args = ctx.message.text.split(" ");
  const senha = args[1];

  if (!senha) {
    return ctx.reply("Use: /login SUA_SENHA");
  }

  // apagar a mensagem do usuário (onde está a senha)
  try {
    await ctx.deleteMessage();
  } catch (err) {
    console.log("Não consegui apagar a mensagem");
  }

  if (senha !== process.env.BOT_PASSWORD) {
    return ctx.reply("❌ Senha incorreta.");
  }

  const userId = ctx.from.id;
  const hoje = new Date().toISOString().slice(0,10);

  usuariosAutenticados[userId] = hoje;

  ctx.reply("✅ Acesso liberado para hoje.");

});


bot.start((ctx) => {
  ctx.reply("🤖 Bot financeiro iniciado!");
});

bot.command("help", async (ctx) => {
  const userId = ctx.from.id;

  if (!isAutenticado(userId)) {
  return ctx.reply("🔒 Use /login SUA_SENHA para acessar.");
  }

  ctx.reply("🤖 Lista de Comandos: \n /lancar \n /fatura \n /resumo \n /minhafatura \n /faturadetalhada");

});


// Lançar compra

bot.command("lancar", async (ctx) => {

  const userId = ctx.from.id;

  if (!isAutenticado(userId)) {
  return ctx.reply("🔒 Use /login SUA_SENHA para acessar.");
  }

  lancamentosEmAndamento[userId] = {
    etapa: "pessoa"
  };

  ctx.reply("👤 Quem fez a compra?");
});

// Consultar fatura

bot.command("fatura", async (ctx) => {

  const userId = ctx.from.id;

  if (!isAutenticado(userId)) {
  return ctx.reply("🔒 Use /login SUA_SENHA para acessar.");
  }

  const args = ctx.message.text.split(" ");
  const mes = args[1];

  if (!mes) {
    return ctx.reply("Use: /fatura YYYY-MM");
  }

  const rows = await getAllRows();

  if (!rows || rows.length === 0) {
    return ctx.reply("Planilha vazia.");
  }

  let total = 0;
  let resposta = `📊 Fatura ${mes}\n\n`;

  rows.slice(1).forEach((row) => {

    if (!row[7]) return;

    if (row[7].trim() === mes && row[9] === "Aberto") {

      const pessoa = row[1];
      const descricao = row[3];
      const parcela = row[5];
      const totalParcelas = row[6];
      const valor = parseFloat(row[4]);

      total += valor;

      resposta += `• ${pessoa} - ${descricao} (${parcela}/${totalParcelas}) R$ ${valor.toFixed(2)}\n`;
    }

  });

  if (total === 0) {
    return ctx.reply(`Nenhum lançamento encontrado para ${mes}`);
  }

  resposta += `\n💰 TOTAL: R$ ${total.toFixed(2)}`;

  ctx.reply(resposta);

});

// Consultar resumo

bot.command("resumo", async (ctx) => {

  const userId = ctx.from.id;

  if (!isAutenticado(userId)) {
  return ctx.reply("🔒 Use /login SUA_SENHA para acessar.");
  }

  const args = ctx.message.text.split(" ");
  const mes = args[1]; // pode vir vazio

  const rows = await getAllRows();

  if (!rows || rows.length <= 1) {
    return ctx.reply("Nenhum lançamento encontrado.");
  }

  const dataRows = rows.slice(1);

  const resumo = {};
  let totalGeral = 0;

  dataRows.forEach((row) => {

    const status = row[9];
    const fatura = row[7];

    if (status !== "Aberto") return;

    if (mes && fatura !== mes) return;

    const pessoa = row[1];
    const valor = parseFloat(row[4]);

    if (!resumo[pessoa]) resumo[pessoa] = 0;

    resumo[pessoa] += valor;
    totalGeral += valor;

  });

  if (totalGeral === 0) {
    return ctx.reply("Nenhum lançamento encontrado.");
  }

  let resposta = mes
    ? `📊 Resumo da fatura ${mes}\n\n`
    : `📊 Resumo geral\n\n`;

  for (let pessoa in resumo) {
    resposta += `${pessoa}: R$ ${resumo[pessoa].toFixed(2)}\n`;
  }

  resposta += `\n💰 TOTAL: R$ ${totalGeral.toFixed(2)}`;

  ctx.reply(resposta);

});

// Consultar resumo por pessoa

bot.command("minhafatura", async (ctx) => {

  const userId = ctx.from.id;

  if (!isAutenticado(userId)) {
  return ctx.reply("🔒 Use /login SUA_SENHA para acessar.");
  }

  const args = ctx.message.text.split(" ");
  const pessoa = args[1];
  const mes = args[2];

  if (!pessoa || !mes) {
    return ctx.reply("Use: /minhafatura NOME YYYY-MM\nExemplo: /minhafatura Luiz 2026-03");
  }

  const rows = await getAllRows();

  if (!rows || rows.length <= 1) {
    return ctx.reply("Nenhum lançamento encontrado.");
  }

  const dataRows = rows.slice(1);

  let total = 0;
  let resposta = `📊 Fatura de ${pessoa} - ${mes}\n\n`;

  dataRows.forEach((row) => {

    const nome = row[1];
    const descricao = row[3];
    const valor = parseFloat(row[4]);
    const parcela = row[5];
    const totalParcelas = row[6];
    const fatura = row[7];
    const status = row[9];

    if (nome?.toLowerCase() === pessoa.toLowerCase() && fatura === mes && status === "Aberto") {

      total += valor;

      resposta += `• ${descricao} (${parcela}/${totalParcelas}) R$ ${valor.toFixed(2)}\n`;

    }

  });

  if (total === 0) {
    return ctx.reply(`Nenhum lançamento encontrado para ${pessoa} em ${mes}.`);
  }

  resposta += `\n💰 Total: R$ ${total.toFixed(2)}`;

  ctx.reply(resposta);

});

// Consultar resumo detalhado por pessoa

bot.command("faturadetalhada", async (ctx) => {

  const userId = ctx.from.id;

  if (!isAutenticado(userId)) {
  return ctx.reply("🔒 Use /login SUA_SENHA para acessar.");
  }

  const args = ctx.message.text.split(" ");
  const pessoa = args[1];
  const mes = args[2];
  const vencimento = args[3];

  if (!pessoa || !mes || !vencimento) {
    return ctx.reply("Use:\n/faturadetalhada NOME YYYY-MM VENCIMENTO\n\nEx: /faturadetalhada Luiz 2026-03 20");
  }

  const rows = await getAllRows();

  const dataRows = rows.slice(1);

  let total = 0;

  let resposta = `📊 Fatura detalhada\n${pessoa} — ${mes}\nVencimento dia ${vencimento}\n\n`;

  dataRows.forEach((row) => {

    const nome = String(row[1]).trim().toLowerCase();
    const descricao = row[3];
    const valor = parseFloat(row[4]);
    const parcela = row[5];
    const totalParcelas = row[6];
    const fatura = String(row[7]).trim();
    const venc = parseInt(row[8]);
    const status = String(row[9]).trim();

    const pessoaInput = pessoa.trim().toLowerCase();
    const mesInput = mes.trim();
    const vencInput = parseInt(vencimento);

    if (String(row[1]).trim().toLowerCase() === pessoa.trim().toLowerCase() && String(row[7]).trim() === mes.trim() && Number(row[8]) === Number(vencimento) && String(row[9]).trim() === "Aberto") {
      total += valor;

      resposta += `• ${descricao} (${parcela}/${totalParcelas}) — R$ ${valor.toFixed(2)}\n`;
    }

  });

  if (total === 0) {
    return ctx.reply("Nenhum lançamento encontrado.");
  }

  resposta += `\n💰 Total: R$ ${total.toFixed(2)}`;

  ctx.reply(resposta);

});

bot.on("text", async (ctx) => {

  const userId = ctx.from.id;
  const text = ctx.message.text;

  if (text.startsWith("/")) return;

  const form = lancamentosEmAndamento[userId];

  if (!form) return;

  switch (form.etapa) {

    case "pessoa":

      form.pessoa = text;
      form.etapa = "cartao";

      return ctx.reply("💳 Qual cartão?");

    case "cartao":

      form.cartao = text;
      form.etapa = "descricao";

      return ctx.reply("📝 Descrição da compra?");

    case "descricao":

      form.descricao = text;
      form.etapa = "valor";

      return ctx.reply("💰 Valor total?");

    case "valor":

      form.valor = parseFloat(text.replace(",", "."));
      form.etapa = "parcelas";

      return ctx.reply("🔢 Quantidade de parcelas?");

    case "parcelas":

      form.parcelas = parseInt(text);
      form.etapa = "fatura";

      return ctx.reply("📅 Primeira fatura? (YYYY-MM)");

    case "fatura":

      form.fatura = text;
      form.etapa = "vencimento";

      return ctx.reply("📆 Dia de vencimento do cartão? (ex: 20)");

    case "vencimento":

      form.vencimento = text;

      const valoresParcelas = gerarParcelas(form.valor, form.parcelas);
      const faturas = gerarFaturas(form.fatura, form.parcelas);

      for (let i = 0; i < form.parcelas; i++) {

        await addRow([
          Date.now(),
          form.pessoa,
          form.cartao,
          form.descricao,
          valoresParcelas[i],
          i + 1,
          form.parcelas,
          faturas[i],
          form.vencimento,
          "Aberto",
          dayjs().format("YYYY-MM-DD"),
        ]);

      }

      delete lancamentosEmAndamento[userId];

      return ctx.reply("✅ Compra lançada com sucesso!");

  }

});

bot.launch();