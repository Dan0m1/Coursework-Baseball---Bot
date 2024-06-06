import {Composer, InlineKeyboard} from 'grammy';
import {fetchSchedule} from "../../lib/api/schedule";
import {MyContext, MyConversation} from "../bot";
import {createConversation} from "@grammyjs/conversations";
import {createTicket} from "../../lib/api/ticket";


export const schedule = new Composer<MyContext>();
schedule.use(createConversation(getCustomerData))

schedule.command('schedule', async (ctx, next) => {
    const emoji = ctx.emoji`${"calendar"}`;
    await ctx.reply(`Введіть дату у форматі YYYY-MM-DD\n${emoji}   (наприклад: 2024-07-01)`);
})


schedule.hears(/^\d{4}-\d{2}-\d{2}$/, async (ctx, next) => {
    // @ts-ignore
    await ctx.react(ctx.emoji`${"ok_hand"}`);
    // @ts-ignore
    const response = await fetchSchedule(ctx.message.text);
    console.log(response);

    if(response === 404) {
        await ctx.reply(`Не знайдено ігор на цю дату ${ctx.emoji`${"disappointed_face"}`}`);
        return;
    }
    if(response === 400) {
        await ctx.reply('Невірний формат дати');
        return;
    }

    try{
        const session: any = await ctx.session;
        if(session.schedule_message_id !== 0) {
            await ctx.api.deleteMessage(ctx.chat.id, session.schedule_message_id);
        }
    }catch (e) {
        console.log(e);
    }

    let i = 0;
    let buttons = [];
    let rows = [];
    let text = '';
    let games = [];
    let map = [];
    for(const game of response.games) {
        map.push(game.id)
        games.push(`${game.team.home} - ${game.team.away}
          \nМісце проведення: ${game.venue.fullName}
          \nШтат: ${game.venue.state}\tМісто: ${game.venue.city}
          \nНайменша вартість квитків: ${game.tickets.price.match(/\d+/)}$
          \nКількість доступних квитків: ${game.tickets.numberAvailable}
          \nПочаток гри: ${game.startDate.match(/\d{2}:\d{2}/)}`);


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
    const keyboardSchedule = InlineKeyboard.from(rows);


    const message = await ctx.reply(text, {
        reply_markup: keyboardSchedule
    });

    const session: any = await ctx.session;
    session.schedule_text = text;
    session.schedule_games = games;
    session.schedule_message_id = message.message_id;
    session.schedule_inlineKeyboard = keyboardSchedule;
    session.schedule_map = map;
});

const keyboardScheduleBack = new InlineKeyboard().text("Повернутись до списку матчів", "back");

schedule.callbackQuery("back", async (ctx) => {
    await ctx.answerCallbackQuery();

    const session: any = await ctx.session;
    await ctx.editMessageText(session.schedule_text, {
        reply_markup: session.schedule_inlineKeyboard
    });
})

schedule.callbackQuery(/^game_/, async (ctx) => {
    await ctx.answerCallbackQuery();

    const game = ctx.callbackQuery.data.split('_')[1];
    const session: any = await ctx.session;
    const gameText = session.schedule_games[+game];
    await ctx.editMessageText(gameText, {
        reply_markup: new InlineKeyboard().text("Придбати квиток", `buy_${game}`).row().text("Повернутись до списку матчів", "back")
    });
})

schedule.callbackQuery(/^buy_/, async (ctx) => {
    await ctx.answerCallbackQuery();

    const game = ctx.callbackQuery.data.split('_')[1];
    const session: any = await ctx.session;
    console.log(session.schedule_map)
    const gameId = session.schedule_map[+game];
    session.schedule_gameId = gameId;
    session.schedule_fromId = ctx.from.id.toString();

    if(gameId !== undefined) {
        await ctx.conversation.enter("getCustomerData");
    }
})

schedule.callbackQuery("end", async (ctx) => {
    await ctx.answerCallbackQuery();

    await ctx.editMessageText('Пошук завершено', {
        reply_markup: undefined
    });
})

async function getCustomerData(conversation: MyConversation, ctx: MyContext) {
    await ctx.reply("Введіть місце.\nПерший символ - латинська літера, яка відповідає за ряд. Другий та третій - номер місця. \nЗразок: \"A22\"")
    const place = await conversation.form.text();
    await ctx.reply("Введіть адресу електронної пошти.\nЗразок: \"email@example.com\"")
    const email = await conversation.form.text()

    await conversation.external(async () => {
        const session: any = await ctx.session;
        const response = await createTicket(session.schedule_fromId, session.schedule_gameId, place, email)
        await ctx.reply(`Ви успішно придбали квиток!\nІдентифікатор транзакції: ${response.transaction}`)
        await ctx.editMessageText("Завершено", {
            reply_markup: keyboardScheduleBack
        })
    })
}