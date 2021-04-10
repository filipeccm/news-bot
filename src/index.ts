import * as Discord from 'discord.js';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { saveSource, deleteSource, getSources, getNews } from './utils';

dotenv.config({ path: '../.env' });

const pool = new Pool({
  host: 'localhost',
  user: process.env.PG_USER,
  password: process.env.PG_PASS,
  port: Number(process.env.PORT),
  database: process.env.PG_DB,
});

const client = new Discord.Client();

client.on('ready', async () => {
  pool.connect((err, client) => {
    if (err) return err.message;
    console.log('Connected to db');
  });
  try {
    pool.query(
      `CREATE TABLE IF NOT EXISTS users(userid BIGINT NOT NULL, username TEXT NOT NULL)`
    );
    pool.query(
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
    saveSource(pool, msg, '!save source');
  }

  if (msg.content === '!get sources') {
    getSources(pool, msg);
  }

  if (msg.content === '!news') {
    getNews(pool, msg);
  }

  if (msg.content.startsWith('!delete source')) {
    deleteSource(pool, msg, '!delete source');
  }
});

const botToken = process.env.BOT_TOKEN;
client.login(botToken);
