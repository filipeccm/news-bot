import * as Discord from 'discord.js';
import axios from 'axios';
import * as sqlite3 from 'sqlite3';

interface NewsData {
  id: string;
  keywords: string[];
  originId: string;
  title: string;
  author: string;
}

type FetchedNewsData = Array<NewsData>;

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
  console.log(allNews);
  return allNews;
};

export const saveSource = (
  msg: Discord.Message,
  userId: string,
  command: string
) => {
  let commandLength = command.length + 1;
  let sourceToSave = msg.content.slice(commandLength);
  let db = new sqlite3.Database('./newsdb.db', sqlite3.OPEN_READWRITE);
  let query = `SELECT * FROM sources WHERE userid = ? AND source = ?`;
  db.get(query, [userId, sourceToSave], (err, row) => {
    if (err) return err.message.toString();
    console.log('row', row);
    if (row === undefined) {
      try {
        let insertData = db.prepare(`INSERT INTO sources VALUES (?,?)`);
        insertData.run(userId, sourceToSave);
        insertData.finalize();
        db.close();
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
  msg: Discord.Message,
  userId: string,
  command: string
) => {
  let commandLength = command.length + 1;
  let sourceToDelete = msg.content.slice(commandLength);
  let db = new sqlite3.Database('./newsdb.db', sqlite3.OPEN_READWRITE);
  let query = `SELECT * FROM sources WHERE userid = ? AND source = ?`;
  db.get(query, [userId, sourceToDelete], (err, row) => {
    if (err) return err.message.toString();
    console.log('row', row);
    if (row === undefined) {
      msg.reply("Sorry, I couldn't find that source");
    } else {
      try {
        db.run(
          `DELETE FROM sources WHERE userid = ? AND source = ?`,
          [userId, sourceToDelete],
          (err) => {
            if (err) msg.reply("Something went wrong. Source wasn't deleted");
            msg.reply('Source was deleted');
          }
        );
        db.close();
      } catch (error) {
        msg.reply(error.message.toString());
      }
    }
  });
};

export const getSources = (msg: Discord.Message, userId: string) => {
  let db = new sqlite3.Database('./newsdb.db', sqlite3.OPEN_READWRITE);
  let query = `SELECT source FROM sources WHERE userid = ?`;
  return db.all(query, [userId], (err, rows) => {
    if (err) msg.reply(err.message.toString());
    if (rows === undefined) {
      msg.reply('You do not have sources');
    } else {
      let sources: string[] = [];
      rows.forEach((row) => sources.push(row.source));
      let replyMsg = sources.join('\n');
      msg.reply(replyMsg);
    }
  });
};

export const getNews = (msg: Discord.Message, userId: string) => {
  let db = new sqlite3.Database('./newsdb.db', sqlite3.OPEN_READWRITE);
  let query = `SELECT source FROM sources WHERE userid = ?`;
  db.all(query, [userId], async (err, rows) => {
    if (err) msg.reply(err.message.toString());
    if (rows === undefined) {
      msg.reply('You do not have news');
    } else {
      let sources: string[] = [];
      rows.forEach((row) => sources.push(row.source));
      const allNews = await fetchAllNews(sources);
      if (allNews) {
        allNews.flat().map((news) => {
          msg.reply(`${news.title}: \n ${news.originId}`);
        });
      }
    }
  });
};
