import {Composer, InlineKeyboard} from 'grammy';
import {MyContext} from "../bot";
import {getTickets} from "../../lib/api/ticket";
import {getGame} from "../../lib/api/game";

export const ticket = new Composer<MyContext>();

ticket.command('tickets', async (ctx, next) => {
    //@ts-ignore
    const tickets = await getTickets(ctx.from.id.toString());

    if(tickets === 404) {
        await ctx.reply(`У вас поки немає квитків ${ctx.emoji`${"disappointed_face"}`}`);
        return;
    }

    let i = 0;
    let buttons = [];
    let rows = [];
    let text = '';

    for(const ticket of tickets) {
        text += `\n${i}: ${ticket.game.name}`;
        buttons.push(InlineKeyboard.text(i.toString(), `ticket_${ticket.game.id}_${ticket.place}_${ticket.email}_${ticket.user.name}`));
        i++;
        if(i % 3 === 0) {
            rows.push(buttons);
            buttons = [];
        }
    }
    text = `Всього матчів: ${i}\n\nОберіть матч:` + text;
    rows.push(buttons);
    rows.push([InlineKeyboard.text("Завершити", "end")]);
    const keyboard = InlineKeyboard.from(rows);


    const message = await ctx.reply(text, {
        reply_markup: keyboard
    });

    const session: any = await ctx.session;
    session.ticket_text = text;
    session.ticket_message_id = message.message_id;
    session.ticket_inlineKeyboard = keyboard;
})

ticket.callbackQuery("back", async (ctx) => {
    await ctx.answerCallbackQuery();

    const session:any = await ctx.session;
    await ctx.editMessageText(session.ticket_text, {
        reply_markup: session.ticket_inlineKeyboard
    });
})

ticket.callbackQuery(/^ticket_/, async (ctx) => {
    await ctx.answerCallbackQuery();

    const game = await getGame(ctx.callbackQuery.data.split('_')[1]);
    const ticketPlace = ctx.callbackQuery.data.split('_')[2];
    const userEmail = ctx.callbackQuery.data.split('_')[3];
    const userName = ctx.callbackQuery.data.split('_')[4];
    const gameText = `${game.team.home} - ${game.team.away}
          \nМісце проведення: ${game.venue.fullName}
          \nШтат: ${game.venue.state}
          \nМісто: ${game.venue.city}
          \nПочаток гри: ${game.startDate.match(/\d{2}:\d{2}/)}
          \nІм'я: ${userName}
          \nМісце: ${ticketPlace}
          \nEmail: ${userEmail}`;
    await ctx.editMessageText(gameText, {
        reply_markup: new InlineKeyboard().text("Повернутись до списку квитків", "back")
    });
})
