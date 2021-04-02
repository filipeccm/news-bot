import * as Discord from 'discord.js';
import * as sqlite3 from 'sqlite3';
import * as dotenv from 'dotenv';
import { saveSource, getSources, getNews, deleteSource } from './utils';

dotenv.config({ path: '../.env' });

const client = new Discord.Client();

let db = new sqlite3.Database(
  './newsdb.db',
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to newsdb.');
  }
);

client.on('ready', () => {
  console.log('Connected as ' + client?.user?.tag);
  db.run(
    `CREATE TABLE IF NOT EXISTS data(userid INTEGER NOT NULL, username TEXT NOT NULL)`
  );
  db.run(
    `CREATE TABLE IF NOT EXISTS sources(userid INTEGER NOT NULL, source TEXT NOT NULL)`
  );
});

client.on('message', async (msg) => {
  const userId = msg.author.id;

  if (msg.author.bot) return;

  if (msg.content === '!commands') {
    msg.reply(
      "**Here are my commands** \n **!news** => see today's news \n \n !get sources => see all your stored sources \n \n !save source <link> => store a new source, where <link> is the source's link \n \n !delete source <link> => delete a source, where <link> is the source's link"
    );
  }

  if (msg.content.startsWith('!save source')) {
    saveSource(msg, userId, '!save source');
  }

  if (msg.content === '!get sources') {
    getSources(msg, userId);
  }

  if (msg.content === '!news') {
    getNews(msg, userId);
  }

  if (msg.content.startsWith('!delete source')) {
    deleteSource(msg, userId, '!delete source');
  }
});

client.login(process.env.BOT_TOKEN);
