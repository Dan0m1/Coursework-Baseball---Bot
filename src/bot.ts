require('dotenv').config({path: '/var/www/baseballbot/_work/.env'});
import {Bot, Context, GrammyError, HttpError, InlineKeyboard} from 'grammy';
import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";
import { fetchSchedule } from '../lib/api/schedule';
import { upsertUser} from "../lib/api/user";


type MyContext = HydrateFlavor<Context>;
const bot = new Bot<MyContext>(process.env.BOT_API_KEY || '')
bot.use(hydrate());

bot.command('start', async (ctx) => {
  await ctx.reply("Привіт! Це бот для отримання інформації про матчі MLB.")
  setTimeout(async () => {
  await ctx.reply("Для початку роботи введіть команду /schedule")
  }, 1000);
  // @ts-ignore
  await upsertUser(ctx.from.id, ctx.from.first_name);
})

bot.command('schedule', async (ctx) => {
    await ctx.reply("Введіть дату у форматі YYYY-MM-DD");
})


let text = '';
let schedule: any;
// @ts-ignore
bot.hears(/^\d{4}-\d{2}-\d{2}$/, async (ctx) => {
  // @ts-ignore
  schedule = await fetchSchedule(ctx.message.text);

  if(schedule === 404) {
    await ctx.reply('Не знайдено ігор на цю дату 😢');
    return;
  }
  if(schedule === 400) {
    await ctx.reply('Невірний формат дати');
    return;
  }

  let i = 0;
  let buttons = [];
  let rows = [];
  for(const game of schedule) {
    text += `\n${i}: ${game.name}`;
    buttons.push(InlineKeyboard.text(i.toString(), `game_${i}`));
    i++;
    if(i % 3 === 0) {
      rows.push(buttons);
      buttons = [];
    }
  }
  text = `Всього матчів: ${i}\n\n\nОберіть матч:\n` + text;
  rows.push(buttons);
  rows.push([InlineKeyboard.text("Завершити пошук", "end")]);
  keyboardSchedule = InlineKeyboard.from(rows);

  await ctx.reply(text, {
    reply_markup: keyboardSchedule
  });

});

let keyboardSchedule: InlineKeyboard;

const keyboardScheduleBack = new InlineKeyboard().text("Повернутись до списку матчів", "back");

bot.on('callback_query:data', async (ctx) => {
    await ctx.answerCallbackQuery();

    if(ctx.callbackQuery.data === 'back') {
      await ctx.editMessageText(text, {
        reply_markup: keyboardSchedule
      });
    }

    if(ctx.callbackQuery.data.startsWith('game_')) {
      const game = ctx.callbackQuery.data.split('_')[1];
      const data = schedule[game];
      const gameText =
          `${data.homeTeam} - ${data.awayTeam}
          \nМісце проведення: ${data.venueFullName}
          \nШтат: ${data.venueState}\tМісто: ${data.venueCity}
          \nНайменша вартість квитків: ${data.ticketsPrice.match(/\d+/)}$
          \nКількість доступних квитків: ${data.ticketsAvailable}
          \nПочаток гри: ${data.startDate.match(/\d{2}:\d{2}/)}`;

      await ctx.editMessageText(gameText, {
        reply_markup: keyboardScheduleBack
      });
    }

    if(ctx.callbackQuery.data === 'end') {
      await ctx.editMessageText('Пошук завершено', {
        reply_markup: undefined
      });
    }
})


bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e= err.error;

  if(e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  }
  else if (e instanceof HttpError) {
    console.error("Error in request:", e);
  }
  else {
    console.error("Unknown error:", e);
  }
});


bot.start();