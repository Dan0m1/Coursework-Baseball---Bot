import {Composer, InlineKeyboard} from 'grammy';
import {fetchSchedule} from "../../lib/api/schedule";
import {MyContext} from "../bot";
import {emojiParser} from "@grammyjs/emoji";

export const schedule = new Composer<MyContext>();
schedule.use(emojiParser());

schedule.command('schedule', async (ctx) => {
    const emoji = ctx.emoji`${"calendar"}`;
    await ctx.reply(`Введіть дату у форматі YYYY-MM-DD\n${emoji}   (наприклад: 2024-07-01)`);
})

// @ts-ignore
schedule.hears(/^\d{4}-\d{2}-\d{2}$/, async (ctx) => {
    // @ts-ignore
    await ctx.react(ctx.emoji`${"ok_hand"}`);
    // @ts-ignore
    const response = await fetchSchedule(ctx.message.text);

    if(response === 404) {
        await ctx.reply(`Не знайдено ігор на цю дату ${ctx.emoji`${"disappointed_face"}`}`);
        return;
    }
    if(response === 400) {
        await ctx.reply('Невірний формат дати');
        return;
    }

    try{
        const session = await ctx.session;
        await ctx.api.deleteMessage(ctx.chat.id, session.message_id);
    }catch (e) {
        console.log(e);
    }

    let i = 0;
    let buttons = [];
    let rows = [];
    // @ts-ignore
    let text = '';
    for(const game of response) {
        text += `\n${i}: ${game.name}`;
        buttons.push(InlineKeyboard.text(i.toString(), `game_${i}`));
        i++;
        if(i % 3 === 0) {
            rows.push(buttons);
            buttons = [];
        }
    }
    text = `Всього матчів: ${i}\n\n\nОберіть матч:\n` + text;
    const session = await ctx.session;
    session.text = text;
    session.games = response;

    rows.push(buttons);
    rows.push([InlineKeyboard.text("Завершити пошук", "end")]);
    keyboardSchedule = InlineKeyboard.from(rows);

    const message = await ctx.reply(text, {
        reply_markup: keyboardSchedule
    });
    session.message_id = message.message_id;
});

let keyboardSchedule: InlineKeyboard;
const keyboardBuyTicket = new InlineKeyboard().text("Купити квиток", "buy");
const keyboardScheduleBack = new InlineKeyboard().text("Повернутись до списку матчів", "back");

schedule.on('callback_query:data', async (ctx) => {
    await ctx.answerCallbackQuery();

    if(ctx.callbackQuery.data === 'back') {
        const session = await ctx.session;
        await ctx.editMessageText(session.text, {
            reply_markup: keyboardSchedule
        });
    }

    if(ctx.callbackQuery.data.startsWith('game_')) {
        const game = ctx.callbackQuery.data.split('_')[1];
        const session = await ctx.session;
        const response = session.games;
        const data = response[+game];
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