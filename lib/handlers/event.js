'use strict';

const async = require('async');
const uuid = require('node-uuid');

const intentHandler = require('./intent');
const responseHandler = require('./response');

const storage = require('../services/storage');
const apiai = require('../services/apiai');
const messenger = require('../services/messenger');

const helpers = require('../helpers');

function onEvent(event, sender) {
  sender = helpers.getSender(event, sender);

  const idStorage = storage.get('ids');
  const clientStorage = storage.get('clients');

  if (!idStorage.has(sender)) {
    idStorage.set(sender, uuid.v1());
  }

  messenger.sendAction(sender, 'mark_seen', () => {
    messenger.sendAction(sender, 'typing_on', () => {
      if (!clientStorage.has(sender)) {
        clientStorage.set(sender, new Map());
        return responseHandler.onFirst(sender);
      }

      // messenger.sendAction(sender, 'typing_on');
      // messenger.sendAction(sender, 'typing_off');

      if (event.message && event.message.attachments) {
        onAttachment(event, sender);
        return;
      }

      if (event.message && event.message.quick_reply) {
        onQuickReply(event, sender);
        return;
      }

      if (event.postback && event.postback.payload) {
        onPostback(event, sender);
        return;
      }

      if (event.message && event.message.text) {
        onMessage(event, sender);
        return;
      }

      responseHandler.onDefault(sender);
    });
  });
}

function onPostback(event, sender) {
  sender = helpers.getSender(event, sender);
  onMessage(event, sender);
}

function onQuickReply(event, sender) {
  sender = helpers.getSender(event, sender);

  let payload = event.message.quick_reply.payload;

  if (payload === 'TWITTER_TOPIC') {
    return responseHandler.onTweet(sender, {
      parameters: {
        topic: payload
      }
    });
  }

  onMessage(event, sender);
}

function onAttachment(event, sender) {
  sender = helpers.getSender(event, sender);

  let attachments = event.message.attachments;

  if (typeof attachments === Array && !attachments.length) {
    return responseHandler.onDefault(sender);
  }

  if (!attachments[0].type === 'location') {
    return responseHandler.onDefault(sender);
  }

  let coordinates = attachments[0].payload.coordinates;
  let title = attachments[0].payload.title;

  responseHandler.onLocation(sender, event.message, coordinates, title);
}

function onLocation(event, sender) {
  sender = helpers.getSender(event, sender);
}

function onMessage(event, sender) {
  sender = helpers.getSender(event, sender);

  let aiRequest = apiai.textRequest(event.message.text, {
    sessionId: storage.get('ids').get(sender)
  });

  aiRequest.on('response', response => {
    if (helpers.isDefined(response.result)) {
      let responseText = response.result.fulfillment.speech;
      let responseData = response.result.fulfillment.data;
      let action = response.result.action;

      if (helpers.isDefined(responseData) && helpers.isDefined(responseData.facebook)) {
        if (!Array.isArray(responseData.facebook)) {
          try {
            messenger.sendMessage(sender, responseData.facebook);
          } catch (err) {
            messenger.sendMessage(sender, {
              text: err.message
            });
          }
        } else {
          async.eachSeries(responseData.facebook, (facebookMessage, callback) => {
            try {
              if (facebookMessage.sender_action) {
                messenger.sendAction(sender, facebookMessage.sender_action, callback);
              } else {
                messenger.sendMessage(sender, facebookMessage, callback);
              }
            } catch (err) {
              messenger.sendMessage(sender, {
                text: err.message
              }, callback);
            }
          });
        }
      } else if (helpers.isDefined(responseText)) {
        // Facebook Messenger API text limit 320
        var splittedText = helpers.splitResponse(responseText);

        async.eachSeries(splittedText, (textPart, callback) => {
          messenger.sendMessage(sender, {
            text: textPart
          }, callback);
        });
      } else {
        if (action === 'input.unknown') {
          responseHandler.onDefault(sender);
          return;
        }

        intentHandler.onIntent(response.result, sender, event);
      }

    } else {
      messenger.sendMessage(sender, {
        text: 'Sorry, there was an error processing your request.'
      });
    }
  });

  aiRequest.on('error', error => {
    messenger.sendMessage(sender, {
      text: 'Sorry, there was an error processing your request.'
    });
    console.error(error)
  });

  aiRequest.end();
}

module.exports = {
  onEvent,
  onPostback,
  onQuickReply,
  onAttachment,
  onLocation,
  onMessage
};
