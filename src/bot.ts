require('dotenv').config(/*{path: '/var/www/baseballbot/_work/.env'}*/);
import {
  Bot,
  Context,
  GrammyError,
  HttpError,
  LazySessionFlavor,
  lazySession,
  InlineKeyboard
} from 'grammy';
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";
import {schedule} from "./middleware/schedule";
import {start} from "./middleware/start";
import {ticket} from "./middleware/ticket";
import {EmojiFlavor, emojiParser} from "@grammyjs/emoji";
import {createStorage, establishConnection} from "../lib/api/session";
import {run} from "@grammyjs/runner";

export interface SessionData {
  schedule_text: string;
  schedule_message_id: number;
  schedule_games: string[];
  schedule_inlineKeyboard: InlineKeyboard;
  schedule_map: [];
  ticket_text: string;
  ticket_message_id: number;
  ticket_inlineKeyboard: InlineKeyboard;
  schedule_email: string;
  schedule_place: string;
  schedule_gameId: string;
  schedule_fromId: string;
}


export type MyContext = EmojiFlavor<HydrateFlavor<Context>> & LazySessionFlavor<SessionData> & ConversationFlavor;
export type MyConversation = Conversation<MyContext>


async function bootstrap() {

  const client = await establishConnection();
  const storage = await createStorage(client);

  const bot = new Bot<MyContext>(process.env.BOT_API_KEY || '')

  bot.use(lazySession({
      storage: storage,
      initial: () => ({schedule_text: '', schedule_message_id: 0, ticket_text: '', ticket_message_id: 0}),

  }));

  bot.use(conversations());
  bot.use(hydrate());
  bot.use(emojiParser());

  bot.use(start)
  bot.use(schedule)
  bot.use(ticket)



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

  const handle = run(bot);
  // @ts-ignore
  handle.task().then(() => {
    console.log("Бот завершив обробку!");
  });
}

bootstrap().catch(console.error);