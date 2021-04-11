import * as Discord from 'discord.js';
import axios from 'axios';
import { Pool } from 'pg';

interface NewsData {
  id: string;
  keywords: string[];
  originId: string;
  title: string;
  author: string;
}

type FetchedNewsData = Array<NewsData>;

export const createUser = async (pg: Pool, msg: Discord.Message) => {
  pg.query(
    'SELECT * FROM users WHERE userid = $1',
    [msg.author.id],
    (err, results) => {
      if (err) console.log(err.message);
      if (!results.rowCount) {
        try {
          pg.query('INSERT INTO users (userid, username) VALUES ($1, $2)', [
            msg.author.id,
            msg.author.username,
          ]);
        } catch (err) {
          console.log(err.message);
        }
      }
    }
  );
};

export const fetchNews = async (
  url: string,
  num: number
): Promise<FetchedNewsData> => {
  const res = await axios.get(
    `https://cloud.feedly.com//v3/streams/contents?streamId=feed/${url}&count=${num}`
  );
  return res.data.items;
};

export const fetchAllNews = async (
  sourceArray: string[]
): Promise<Array<FetchedNewsData>> => {
  let allNews = await Promise.all(
    sourceArray.map(async (source) => {
      let news = await fetchNews(source, 1);
      return news;
    })
  );
  return allNews;
};

export const saveSource = async (
  pg: Pool,
  msg: Discord.Message,
  command: string
) => {
  //see if user exists
  await createUser(pg, msg);

  let commandLength = command.length + 1;
  let sourceToSave = msg.content.slice(commandLength);
  let query = 'SELECT * FROM sources WHERE userid = $1 AND source = $2';
  pg.query(query, [msg.author.id, sourceToSave], (err, results) => {
    if (err) return console.log(err.message.toString());
    if (!results.rowCount) {
      try {
        pg.query('INSERT INTO sources (userid, source) VALUES ($1, $2)', [
          msg.author.id,
          sourceToSave,
        ]);
        msg.reply('Your source has been saved!');
      } catch (error) {
        msg.reply(error.message.toString());
      }
    } else {
      msg.reply("You've already saved this source");
    }
  });
};

export const deleteSource = (
  pg: Pool,
  msg: Discord.Message,
  command: string
) => {
  let commandLength = command.length + 1;
  let sourceToDelete = msg.content.slice(commandLength);
  let query = `SELECT * FROM sources WHERE userid = $1 AND source = $2`;
  pg.query(query, [msg.author.id, sourceToDelete], (err, results) => {
    if (err) return console.log(err.message);
    if (!results.rowCount) {
      msg.reply("Sorry, I couldn't find that source");
    } else {
      try {
        pg.query(
          `DELETE FROM sources WHERE userid = $1 AND source = $2`,
          [msg.author.id, sourceToDelete],
          (err) => {
            if (err) msg.reply("Something went wrong. Source wasn't deleted");
            msg.reply('Source was deleted');
          }
        );
      } catch (error) {
        msg.reply(error.message.toString());
      }
    }
  });
};

export const getSources = (pg: Pool, msg: Discord.Message) => {
  let query = 'SELECT source FROM sources WHERE userid = $1';
  try {
    pg.query(query, [msg.author.id], (err, results) => {
      if (err) console.log(err.message);
      if (!results || !results.rowCount) {
        msg.reply('You do not have sources');
      } else {
        let sources: string[] = [];
        results.rows.forEach((row) => sources.push(row.source));
        let replyMsg = sources.join('\n');
        msg.reply(replyMsg);
      }
    });
  } catch (err) {
    console.log(err.message);
  }
};

export const getNews = (pg: Pool, msg: Discord.Message) => {
  let query = 'SELECT source FROM sources WHERE userid = $1';
  pg.query(query, [msg.author.id], async (err, results) => {
    if (err) console.log(err.message);
    if (!results || !results.rowCount) {
      msg.reply("Sorry, it seems like you don't have sources yet");
    } else {
      let sources: string[] = [];
      results.rows.forEach((row) => sources.push(row.source));
      const allNews = await fetchAllNews(sources);
      if (allNews[0].length > 0) {
        allNews.flat().map((news) => {
          msg.reply(`${news.title}: \n ${news.originId}`);
        });
      } else {
        msg.reply('No news is good news');
      }
    }
  });
};
