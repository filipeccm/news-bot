import * as Discord from 'discord.js';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { saveSource, deleteSource, getSources, getNews } from './utils';

dotenv.config({ path: '../.env' });

const pg = new Client({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASS,
  port: Number(process.env.PORT),
  database: process.env.PG_DB,
  connectionString: process.env.DATABASE_URL,
});

const client = new Discord.Client();

const botToken = process.env.BOT_TOKEN;
try {
  client.login(botToken);
} catch (err) {
  console.error('error on login', err.stack);
}

client.on('ready', async () => {
  pg.connect((err) => {
    if (err) return console.error('Could not connect to db', err.stack);
    console.log('Connected to db');
  });
  try {
    pg.query(
      `CREATE TABLE IF NOT EXISTS users(userid BIGINT NOT NULL, username TEXT NOT NULL)`
    );
    pg.query(
      `CREATE TABLE IF NOT EXISTS sources(userid BIGINT NOT NULL, source TEXT NOT NULL)`
    );
  } catch (err) {
    console.log(err);
  }
});

client.on('message', async (msg) => {
  if (msg.author.bot) return;

  if (msg.content === '!commands') {
    msg.reply(
      "**Here are my commands** \n **!news** => see today's news \n \n !get sources => see all your stored sources \n \n !save source <link> => store a new source, where <link> is the source's link \n \n !delete source <link> => delete a source, where <link> is the source's link"
    );
  }

  if (msg.content.startsWith('!save source')) {
    saveSource(pg, msg, '!save source');
  }

  if (msg.content === '!get sources') {
    getSources(pg, msg);
  }

  if (msg.content === '!news') {
    getNews(pg, msg);
  }

  if (msg.content.startsWith('!delete source')) {
    deleteSource(pg, msg, '!delete source');
  }
});
