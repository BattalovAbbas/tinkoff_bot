const lib = require('tinkoff-invest-api');
const TelegramBot = require('node-telegram-bot-api');

const telegramToken = process.env.TELEGRAM;
const tinkoffToken = process.env.TINKOFF;

const api = new lib.TinkoffInvestApi({ token: tinkoffToken });

let bot;
if (process.env.NODE_ENV === 'production') {
  const port = process.env.PORT || 443;
  const url = process.env.CUSTOM_ENV_VARIABLE || '0.0.0.0';
  bot = new TelegramBot(telegramToken, { webHook: { port, url } });
  bot.setWebHook(url + ':' + port + '/bot' + telegramToken);
} else {
  bot = new TelegramBot(telegramToken, { polling: true });
}

bot.onText(/\/start/, (msg, match) => {
    start(msg.chat.id);
});

bot.onText(/\/stop/, (msg, match) => {
    stop(msg.chat.id);
});

async function start(chatId) {
    const { accounts } = await api.users.getAccounts({});

    const portfolio = await api.operations.getPortfolio({ accountId: accounts[0].id });
    
    bot.sendMessage(chatId, `Start with ${lib.Helpers.toNumber(portfolio.totalAmountShares)}`);

    const unsubscribe = await api.stream.market.lastPrice({
        instruments: [
          { figi: 'BBG0013HGFT4' }
        ],
        waitingClose: false,
      }, data => {
        bot.sendMessage(chatId, `${lib.Helpers.toNumber(data.price)} ${new Date(data.time).toLocaleTimeString()}`);
      });
}

async function stop(chatId) {
    await api.stream.market.cancel();
    const { accounts } = await api.users.getAccounts({});

    const portfolio = await api.operations.getPortfolio({ accountId: accounts[0].id });
    
    bot.sendMessage(chatId, `Stop with ${lib.Helpers.toNumber(portfolio.totalAmountShares)}`);
}
