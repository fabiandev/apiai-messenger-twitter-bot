'use strict';

const async = require('async');
const uuid = require('node-uuid');

const store = require('../services/storage');
const apiai = require('../services/apiai');
const messenger = require('../services/messenger');

const getSender = require('../helpers/getSender');
const isDefined = require('../helpers/isDefined');
const splitResponse = require('../helpers/splitResponse');

function onEvent(event, sender) {
  sender = getSender(event, sender);

  const idStorage = store.get('ids');
  const clientStorage = store.get('clients');

  if (!idStorage.has(sender)) {
    idStorage.set(sender, uuid.v1());
  }

  if (!clientStorage.has(sender)) {
    clientStorage.set(sender, {});
  }

  const clientData = clientStorage.get(sender);

  messenger.sendAction(sender, 'mark_seen');
  messenger.sendAction(sender, 'typing_on');

  if (event.postback && event.postback.payload) {
    onPostback(event, sender);
    return;
  }

  if (event.message && event.message.quick_reply) {
    onQuickReply(event, sender);
    return;
  }

  if (event.message && event.message.attachments) {
    onAttachment(event, sender);
    return;
  }

  if (event.message && event.message.text) {
    onMessage(event, sender);
    return;
  }

  onDefault(event, sender);
}

function onPostback(event, sender) {
  sender = getSender(event, sender);

  messenger.sendAction(sender, 'typing_off');
}

function onQuickReply(event, sender) {
  sender = getSender(event, sender);

  messenger.sendAction(sender, 'typing_off');
}

function onAttachment(event, sender) {
  sender = getSender(event, sender);

  let attachments = event.message.attachments;

  if (typeof attachments === Array && !attachments.length) {
    return onDefault(event, sender);
  }

  if (!attachments[0].type === 'location') {
    return onDefault(event, sender);
  }

  let coordinates = attachments[0].payload.coordinates;

  messenger.sendAction(sender, 'typing_off');
}

function onLocation(event, sender) {
  sender = getSender(event, sender);

  messenger.sendAction(sender, 'typing_off');
}

function onMessage(event, sender) {
  sender = getSender(event, sender);

  let aiRequest = apiai.textRequest(event.message.text, {
    sessionId: store.get('ids').get(sender)
  });

  aiRequest.on('response', response => {
    if (isDefined(response.result)) {
      let responseText = response.result.fulfillment.speech;
      let responseData = response.result.fulfillment.data;
      let action = response.result.action;

      if (isDefined(responseData) && isDefined(responseData.facebook)) {
        if (!Array.isArray(responseData.facebook)) {
          try {
            messenger.sendAction(sender, 'typing_off');
            messenger.sendMessage(sender, responseData.facebook);
          } catch (err) {
            messenger.sendAction(sender, 'typing_off');
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
                messenger.sendAction(sender, 'typing_off');
                messenger.sendMessage(sender, facebookMessage, callback);
              }
            } catch (err) {
              messenger.sendAction(sender, 'typing_off');
              messenger.sendMessage(sender, {
                text: err.message
              }, callback);
            }
          });
        }
      } else if (isDefined(responseText)) {
        // facebook API limit for text length is 320,
        // so we must split message if needed
        var splittedText = splitResponse(responseText);

        async.eachSeries(splittedText, (textPart, callback) => {
          messenger.sendAction(sender, 'typing_off');

          messenger.sendMessage(sender, {
            text: textPart
          }, callback);
        });
      } else {
        // TODO: Process intent response via intent service and respond
        messenger.sendAction(sender, 'typing_off');
      }

    } else {
      messenger.sendAction(sender, 'typing_off');
      messenger.sendMessage(sender, {
        text: 'Sorry, there was an error processing your request.'
      });
    }
  });

  aiRequest.on('error', error => {
    messenger.sendAction(sender, 'typing_off');
    messenger.sendMessage(sender, {
      text: 'Sorry, there was an error processing your request.'
    });
    console.error(error)
  });

  aiRequest.end();
}

function onDefault(event, sender) {
  sender = getSender(event, sender);

  messenger.sendAction(sender, 'typing_off');
}

module.exports = {
  onEvent,
  onPostback,
  onQuickReply,
  onAttachment,
  onLocation,
  onMessage
};
