require('dotenv').config({path: '/var/www/baseballbot/_work/.env'});
import {Bot, Context, GrammyError, HttpError, SessionFlavor, session} from 'grammy';
import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";
import {schedule} from "./middleware/schedule";
import {start} from "./middleware/start";
import {EmojiFlavor, emojiParser} from "@grammyjs/emoji";
// import {createStorage, establishConnection} from "../lib/api/session";

type game = {
  name: string;
  id: number;
  homeTeam: string;
  awayTeam: string;
  venueFullName: string;
  venueCity: string;
  venueState: string;
  ticketsPrice: string;
  ticketsAvailable: string;
  startDate: string;
}

interface SessionData {
  text: string;
  message_id: number;
  games: game[];
}


export type MyContext = EmojiFlavor<HydrateFlavor<Context>> & SessionFlavor<SessionData>;

async function bootstrap() {

  // const client = await establishConnection();
  // const storage = await createStorage(client);

  const bot = new Bot<MyContext>(process.env.BOT_API_KEY || '')

  bot.use(session({
    initial: () => ({text: '', message_id: 0}),
  }));

  bot.use(hydrate());
  bot.use(emojiParser());

  bot.use(start)
  bot.use(schedule)

  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;

    if (e instanceof GrammyError) {
      console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Error in request:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });

  bot.start();
}

bootstrap().catch(console.error);