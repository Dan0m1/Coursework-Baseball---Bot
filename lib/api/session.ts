import {Client} from "pg";
import {PsqlAdapter} from "@grammyjs/storage-psql";

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
    const adapter = await PsqlAdapter.create({ tableName: 'sessions', client });
}