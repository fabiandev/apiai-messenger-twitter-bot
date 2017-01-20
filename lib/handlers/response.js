'use strict';

const async = require('async');
const helpers = require('../helpers');
const storage = require('../services/storage');
const messenger = require('../services/messenger');
const twitter = require('../services/twitter');

function onName(sender, result) {
  let client = storage.get('clients').get(sender);
  let name = result.parameters['given-name'];

  client.delete('lastQuestion');

  if (client.has('name')) {
    messenger.sendMessage(sender, {
      text: `Alright, I will now call you ${name}!`
    });
  } else {
    messenger.sendMessage(sender, {
      text: `Thanks ${name}, you can always change how I should call you by typing something like "Call me John" :)`
    }, () => {
      if (!client.has('firstHelp')) {
        onHelp(sender, result);
        client.set('firstHelp', true);
      }
    });
  }

  client.set('name', name);
}

function onReset(sender, result) {
  storage.get('clients').delete(sender);

  messenger.sendMessage(sender, {
    text: 'Done. You can now start over.'
  });
}

function onTrending(sender, result) {
  let client = storage.get('clients').get(sender);

  if (!client.has('location')) {
    client.set('wasAsking', 'trending');
    return onLocation(sender);
  }

  client.set('wasAsking', null);

  messenger.sendMessage(sender, {
    text: 'Let me check trending topics on Twitter for you.'
  }, () => {
    messenger.sendAction(sender, 'typing_on', () => {
      let location = client.get('location');
      let woeid = 1;
      let name = 'Worldwide';

      if (!location.none) {
        return twitter.get('trends/closest', location.coordinates, (err, data, response) => {
          if (data && data[0] && data[0].woeid) {
            woeid = data[0].woeid;
            name = data[0].name;
          }

          onTrendingForWoeid(sender, {}, woeid, name);
        });
      }

      onTrendingForWoeid(sender, {}, woeid, name);
    });
  });
}

function onTweet(sender, result, more) {
  let topic = result.parameters.topic;
  let client = storage.get('clients').get(sender);
  let name = client.get('name');

  client.set('topic', topic);

  twitter.get('search/tweets', {
    q: topic,
    count: 5
  }, function(err, data, response) {
    if (err || !data || !data.statuses) {
      return messenger.sendMessage(sender, {
        text: 'Sorry, there was an error communicating with Twitter.'
      });
    }

    let messages = data.statuses.slice(0, 5).map((tweet) => {
      return tweet.text;
    });

    let cond = 'more';
    if (!more) {
      cond = 'a few';
      messages.push('Tell me if you want to see more :)');
    }

    messenger.sendMessage(sender, {
      text: name ? `Here are ${cond} Tweets, ${name}:` : `Here are ${cond} tweets:`
    }, () => {
      async.eachSeries(messages, (textPart, callback) => {
        messenger.sendMessage(sender, {
          text: textPart
        }, callback);
      });
    });
  });
}

function onOkay(sender, result) {
  let response = helpers.randomItem([
    "✌️",
    "👌",
    "👍",
    "🎉",
    "😊",
    "😉"
  ]);

  messenger.sendMessage(sender, {
    text: response
  });
}

function onMore(sender, result) {
  if (!storage.get('clients').get(sender).has('topic')) {
    return messenger.sendMessage(sender, {
      text: 'Please tell me, which topic I should get you tweets for or ask me for trending topics.'
    })
  }

  onTweet(sender, {
    parameters: {
      topic: storage.get('clients').get(sender).get('topic')
    }
  }, true);
}

function onTrendingForWoeid(sender, result, woeid, locationName) {
  twitter.get('trends/place', {
    id: woeid
  }, (err, data, response) => {
    if (err) {
      return messenger.sendMessage(sender, {
        text: 'Sorry, there was an error speaking to Twitter.'
      });
    }

    if (!data || !data[0] || !data[0].trends || !data[0].trends.length) {
      client.set('lastQuestion', 'change_location');

      return async.eachSeries([
        `There are currently no trends available for ${locationName} :(`,
        'Do you want to change your location?'
      ], (textPart, callback) => {
        messenger.sendMessage(sender, {
          text: textPart
        }, callback);
      });
    }

    let quickReplies = data[0].trends.slice(0, 11).map((val) => {
      return {
        'content_type': 'text',
        'title': val.name,
        'payload': `TWITTER_TOPIC`
      };
    });

    messenger.sendMessage(sender, {
      text: `Here are some trending topics for ${locationName}. You can tap a tag and I will get you a few tweets for it :)`,
      "quick_replies": quickReplies
    });
  });
}

function onLocation(sender, result, coordinates, title) {
  let client = storage.get('clients').get(sender);
  let hadLocation = false;

  if (!coordinates) {
    client.set('lastQuestion', 'location');

    return messenger.sendMessage(sender, {
      text: 'Please click the button below to share your location:',
      'quick_replies': [{
        'content_type': 'location'
      }, {
        'content_type': 'text',
        'title': 'No thanks.',
        'payload': 'No'
      }]
    });
  }

  if (client.has('location')) {
    hadLocation = true;
  }

  client.set('location', {
    none: false,
    name: title,
    coordinates: coordinates
  });

  messenger.sendMessage(sender, {
    text: hadLocation ?
      `I've changed your location to ${title}.` : 'Thanks for sharing your location :)'
  }, () => {
    if (client.get('wasAsking') === 'trending') {
      onTrending(sender);
    }
  });
}

function onYes(sender, result) {
  const client = storage.get('clients').get(sender);
  let lastQuestion = client.get('lastQuestion');
  let wasAsking = client.get('wasAsking');
  let interacted = false;

  client.delete('lastQuestion');
  client.delete('wasAsking');

  if (lastQuestion === 'name') {
    interacted = true;

    messenger.sendMessage(sender, {
      text: `Cool, can you please type your name?`
    });
  }

  if (lastQuestion === 'location') {
    interacted = true;

    messenger.sendMessage(sender, {
      text: `OK, please tap the button above to share your location. Alternatively you can also type it in here.`
    });
  }

  if (lastQuestion === 'help') {
    interacted = true;

    setTimeout(() => {
      onHelp(sender, result);
    });
  }

  if (lastQuestion === 'change_location') {
    interacted = true;

    setTimeout(() => {
      onLocation(sender);
    });
  }

  if (wasAsking === 'trending') {
    interacted = true;

    setTimeout(() => {
      onTrending(sender);
    });
  }

  if (!interacted) {
    setTimeout(() => {
      onDefault(sender, result);
    })
  }
}

function onNo(sender, result) {
  const client = storage.get('clients').get(sender);
  let lastQuestion = client.get('lastQuestion');
  let wasAsking = client.get('wasAsking');
  let interacted = false;

  client.delete('lastQuestion');
  client.delete('wasAsking');

  if (lastQuestion === 'name') {
    interacted = true;
    async.eachSeries([
      `That's fine too :)`,
      'Anyway, if you change your mind, just say something like "Call me John".'
    ], (textPart, callback) => {
      messenger.sendMessage(sender, {
        text: textPart
      }, callback);
    }, () => {
      if (!client.has('firstHelp')) {
        onHelp(sender, result);
        client.set('firstHelp', true);
      }
    });
  }

  if (lastQuestion === 'help') {
    interacted = true;

    messenger.sendMessage(sender, {
      text: `Don't worry, let me know if you need help.`
    });
  }

  if (lastQuestion === 'location') {
    interacted = true;

    client.set('location', {
      none: true
    });

    messenger.sendMessage(sender, {
      text: `OK, let me know if you change your mind.`
    });
  }

  if (lastQuestion === 'change_location') {
    interacted = true;

    messenger.sendMessage(sender, {
      text: 'Alright, maybe just try again later.'
    });
  }

  if (wasAsking === 'trending') {
    interacted = true;

    setTimeout(() => {
      onTrending(sender);
    });
  }

  if (!interacted) {
    setTimeout(() => {
      onDefault(sender, result);
    });
  }
}

function onHelp(sender, result) {
  messenger.sendMessage(sender, {
    text: 'You can do things like:',
    'quick_replies': [{
      'content_type': 'text',
      'title': 'What\'s trending?',
      'payload': 'What\'s trending?'
    }, {
      'content_type': 'text',
      'title': 'Tweets for #hashtag',
      'payload': 'Tweets for #hashtag'
    }, {
      'content_type': 'text',
      'title': 'Change my location',
      'payload': 'Change my location'
    }, {
      'content_type': 'text',
      'title': 'Call me John',
      'payload': 'Call me John'
    }, {
      'content_type': 'text',
      'title': 'I need help',
      'payload': 'I need help'
    }, {
      'content_type': 'text',
      'title': 'Reset',
      'payload': 'Reset'
    }]
  });
}

function onDefault(sender, result) {
  const client = storage.get('clients').get(sender);
  client.set('lastQuestion', 'help');

  let response = helpers.randomItem([
    "I'm sorry. I'm having trouble understanding the question. Do you need help?",
    "I think I may have misunderstood your last statement.  Do you need help?",
    "I'm sorry. I didn't quite grasp what you just said.  Do you need help?",
    "I'm a bit confused by that last part.  Do you need help?",
    "I'm not totally sure about that.  Do you need help?",
    "I'm not sure I follow. Do you need help?",
    "I'm afraid I don't understand. Do you need help?",
    "I'm a bit confused. Do you need help?"
  ]);

  messenger.sendMessage(sender, {
    text: response
  });
}

function onFirst(sender, result) {
  const client = storage.get('clients').get(sender);
  client.set('lastQuestion', 'name');

  messenger.sendMessage(sender, {
    text: 'Hi there! This is the first time writing with me. Would you tell me your name?'
  });
}

module.exports = {
  onName,
  onReset,
  onTrending,
  onLocation,
  onYes,
  onNo,
  onDefault,
  onFirst,
  onTweet,
  onMore,
  onHelp,
  onOkay
};
