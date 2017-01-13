# Facebook Messenger Twitter Bot

This bot gets trending topics and tweets based on your location.

# Quickstart

```sh
$ git clone https://github.com/fabiandev/apiai-messenger-twitter-bot.git
$ cd apiai-messenger-twitter-bot
$ cp .env.example .env
$ yarn
```

> Tip: You can use `npm` instead of yarn.

1. Import intents and entities from [`data/apiai.zip`](/data/apiai.zip)
to [api.ai](https://api.ai)
2. [Create a Facebook app](https://developers.facebook.com) and assign it to a page
3. Add the verify token from api.ai and the webhook URL (https://bot.example.tld/webhook) to your Facebook app and select the events `messages` and `messaging_postbacks`
4. Fill in your credentials in `.env`
5. Run `yarn start`
6. Write with your bot through the Facebook page

# Deployment

This app supports deployment to [OpenShift](https://www.openshift.com) out-of-the-box:

1. Create an app for Node.js
2. Add environment variables from `.env`
3. Force-push master to the git remote of your OpenShift app

# Live Preview

The bot was not submitted for approval yet. If you want to try it out,
please leave me a message and I will add you as a tester. Once you have been added,
scan the code below in the Facebook Messenger app:

<img src="/data/messenger_code.png" align="center" width="300">
> Icon "Robot, twitter icon" by Sneh Roy [[Source](https://www.iconfinder.com/icons/35063/robot_twitter_icon#size=512)]

# Credits

- [api.ai](https://api.ai) for natural language processing
- [Express](https://github.com/expressjs/expressjs.com) for the server
- [twit](https://github.com/ttezel/twit) for the [Twitter API](https://dev.twitter.com/rest/public)
