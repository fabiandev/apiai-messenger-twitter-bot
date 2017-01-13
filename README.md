# Facebook Messenger Twitter Bot

This bot gets trending topics and tweets based on your location.

# Quickstart

```sh
$ git clone https://github.com/fabiandev/apiai-messenger-twitter-bot.git
$ cd apiai-messenger-twitter-bot
$ cp server/.env.example server/.env
$ yarn
```


Import intents and entities from `[data/apiai.zip](https://github.com/fabiandev/data)`
to [api.ai](https://api.ai), fill in your credentials in `server/.env` and run `yarn start`.

> Tip: You can use `npm` instead of yarn.

# Credits

- [api.ai](https://api.ai) for natural language processing
- [Express](https://github.com/expressjs/expressjs.com) for the server
- [twit](https://github.com/ttezel/twit) for the [Twitter API](https://dev.twitter.com/rest/public)
