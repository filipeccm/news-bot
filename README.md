# News Bot
News Bot is a Discord bot that allows the user to store RSS URLs and retrieve news from them. It was developed with TypeScript and uses a Postgresql database. The project is hosted at Heroku.  

## Usage

Clone the repository into the directory and install the packages. To get your own bot token you have to first create an application at Discord.

```bash
git clone https://github.com/filipeccm/news-bot.git
cd news-bot
npm install or yarn install
``` 

You also have to create a database to store the users and sources. 

```bash
npm start
```
TypeScript files are compiled to JavaScript and the node server starts.

## Bot commands

Open Discord and you can give your bot these commands: 

**!get sources**: get the sources the user has already stored

**!delete source <url>**: delete a source, where <url> is the source's link 

**!save source <url>**: save a new source, where <url> is the source's link

**!news**: retrieve the news from your sources 

