import {Client} from "pg";
import {PsqlAdapter} from "@grammyjs/storage-psql";
import {SessionData} from "../../src/bot";

export async function establishConnection() {
    const client  = new Client({
        connectionString: process.env.SESSION_DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        },
    });

    await client.connect();
    return client;
}

export async function createStorage(client: Client) {
    const adapter = await (PsqlAdapter<SessionData>).create({ tableName: 'sessions', client });
    return adapter;
}