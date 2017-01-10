'use strict';

const JSONbig = require('json-bigint');
const messenger = require('../services/messenger');
const eventHandler = require('./event');

function onGet(req) {
  if (req.query['hub.verify_token'] == process.env.FB_VERIFY_TOKEN) {

    setTimeout(() => {
      messenger.subscribe();
    }, 3000);

    return {
      success: true,
      result: req.query['hub.challenge']
    };
  }

  return {
    success: true,
    result: 'Verify token not matching'
  };
}

function onPost(req) {
  try {
    let data = JSONbig.parse(req.body);

    if (data.entry) {
      let entries = data.entry;
      entries.forEach((entry) => {
        let messaging_events = entry.messaging;
        if (messaging_events) {
          messaging_events.forEach((event) => {
            if (event.message && !event.message.is_echo ||
              event.postback && event.postback.payload) {
              eventHandler.onEvent(event);
            }
          });
        }
      });
    }

    return {
      success: true
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      result: err
    };
  }
}

module.exports = {
  onGet,
  onPost
}
