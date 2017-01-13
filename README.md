# Facebook Messenger Twitter Bot

This bot gets trending topics and tweets based on your location.

# Quickstart

```sh
$ git clone https://github.com/fabiandev/apiai-messenger-twitter-bot.git
$ cd apiai-messenger-twitter-bot
$ cp .env.example .env
$ yarn
```


Import intents and entities from [`apiai.zip`](/data/apiai.zip) `data/`
to [api.ai](https://api.ai), fill in your credentials in `.env` and run `yarn start`.

> Tip: You can use `npm` instead of yarn.

# Deployment

This app supports deployment to [OpenShift](https://www.openshift.com) out-of-the-box:

1. Create an app for Node.js
2. Add environment variables from `.env`
3. Force-push master to the git remote of your OpenShift app

# Live Preview

The bot was not submitted for approval yet. If you want to try it out,
please leave me a message and I will add you as a tester.

<img src="/data/messenger_code.png" align="center" width="300">

# Credits

- [api.ai](https://api.ai) for natural language processing
- [Express](https://github.com/expressjs/expressjs.com) for the server
- [twit](https://github.com/ttezel/twit) for the [Twitter API](https://dev.twitter.com/rest/public)
