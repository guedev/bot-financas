# Bot para controle financeiro

Bot do Telegram para **controle de gastos em cartão de crédito**, utilizando **Google Sheets como banco de dados**.

O bot permite registrar compras parceladas, consultar faturas e visualizar resumos por pessoa, mês e vencimento do cartão.

Ideal para casos em que **várias pessoas utilizam o mesmo cartão**, facilitando o controle de quem deve pagar cada conta.

---

# Funcionalidades

✔ Registrar compras parceladas  
✔ Distribuir automaticamente parcelas entre faturas  
✔ Consultar fatura por mês  
✔ Ver resumo geral ou por pessoa  
✔ Fatura detalhada por pessoa  
✔ Filtrar por vencimento do cartão  
✔ Autenticação por senha diária  
✔ Restrição de acesso por ID do Telegram  
✔ Armazenamento em Google Sheets (sem necessidade de banco de dados)

---

# Estrutura da Planilha

A planilha do Google Sheets deve possuir as seguintes colunas:

| Coluna | Campo |
|------|------|
| A | ID |
| B | Pessoa |
| C | Cartão |
| D | Descrição |
| E | Valor_Parcela |
| F | Parcela |
| G | Total_Parcelas |
| H | Fatura |
| I | Vencimento |
| J | Status |
| K | Data_Lançamento |

Exemplo:

| Pessoa | Cartão | Descrição | Valor_Parcela | Parcela | Total_Parcelas | Fatura |
|------|------|------|------|------|------|------|
Marilia | Inter | Celular | 360 | 1 | 10 | 2025-06 |

---

# Tecnologias utilizadas

- Node.js
- Telegraf (Telegram Bot Framework)
- Google Sheets API
- DayJS
- Dotenv

---

# Instalação

Clone o repositório:

```bash
git clone https://github.com/guedev/bot-financas.git
cd bot-financas 
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo .env na raíz do projeto:

```bash
BOT_TOKEN=token_do_telegram
SPREADSHEET_ID=id_da_planilha_google
BOT_PASSWORD=senha
ALLOWED_USER_ID=id_da_conta_telegram
```

Credenciais Google Sheets

1. Acesse o Google Cloud Console
```bash
https://console.cloud.google.com
```

2. Crie um Service Account
3. Gere uma chave JSON
4. Crie um arquivo credentials.js e coloque a chave JSON
5. Compatilhe sua planilha com o email da Service Account


# Executar o bot

```bash
node index.js
```

# Comandos do Bot

Login

```bash
/login SENHA
```
Libera o uso do bot por 1 dia

Lançar gasto/compra

```bash
/lancar
```
O bot abrirá um formulário interativo perguntando:
Quem fez a compra?
Qual cartão?
Descrição da compra?
Valor total?
Quantidade de parcelas?
Primeira fatura?
Vencimento do cartão?

Ver a fatura do mês

```bash
/fatura YYYY-MM
```

Resumo Geral

```bash
/resumo
```

Resumo de um mês

```bash
/resumo YYYY-MM
```

Fatura de uma pessoa específica

```bash
/minhafatura NOME YYYY-MM
```

Fatura detalhada por pessoa e vencimento

```bash
/faturadetalhada NOME YYYY-MM VENCIMENTO
```

# Segurança

O bot possui duas camadas de segurança.
1. Restrição por ID:
Somente o usuário configurado pode usar o bot.
2. login diário:
O acesso é liberado somente após autenticação:.

# Licença

MIT License