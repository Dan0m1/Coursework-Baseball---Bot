require('dotenv').config();
import {Bot, GrammyError, HttpError} from 'grammy';

const bot = new Bot('7127783747:AAEbY7TOLmXLw4M_bSgXdP0HNfTSr2Famtc');

bot.command('start', async (ctx) => {
  await ctx.reply("Привіт!")
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