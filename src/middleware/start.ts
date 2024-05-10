import {upsertUser} from "../../lib/api/user";
import {Composer} from "grammy";
import {MyContext} from "../bot";

export const start = new Composer<MyContext>();

start.command('start', async (ctx) => {
    const string = ctx.emoji`${"baseball"}`;
    await ctx.reply("Привіт! Це бот для отримання інформації про матчі MLB."+string)
    setTimeout(async () => {
        await ctx.reply("Для початку роботи введіть команду /schedule")
    }, 500);
    // @ts-ignore
    await upsertUser(ctx.from.id, ctx.from.first_name);
})