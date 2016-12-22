'use strict';

const request = require('request');

function subscribe() {
  request({
      method: 'POST',
      uri: `${process.env.FB_API_URL}/me/subscribed_apps?access_token=${process.env.FB_PAGE_ACCESS_TOKEN}`
    },
    (error, response, body) => {
      if (error) {
        console.error('Subscription Error', error);
      } else {
        let result = response.body;

        try {
          result = JSON.parse(result);
        } catch (err) {}

        result = result.success === true ?
          'Successfully subscribed to Facebook Messenger API' :
          `Subscription result from Facebook Messenger: ${result}`;

        console.log(result);
      }
    });
}

function sendMessage(sender, messageData, callback) {
  request({
    url: `${process.env.FB_API_URL}/me/messages`,
    qs: {
      access_token: process.env.FB_PAGE_ACCESS_TOKEN
    },
    method: 'POST',
    json: {
      recipient: {
        id: sender
      },
      message: messageData
    }
  }, (error, response, body) => {
    if (error) {
      console.error('Error Sending Message', error);
    } else if (response.body.error) {
      console.error('Error', response.body.error);
    }

    if (callback) {
      callback();
    }
  });
}

function sendAction(sender, action, callback) {
  setTimeout(() => {
    request({
      url: `${process.env.FB_API_URL}/me/messages`,
      qs: {
        access_token: process.env.FB_PAGE_ACCESS_TOKEN
      },
      method: 'POST',
      json: {
        recipient: {
          id: sender
        },
        sender_action: action
      }
    }, (error, response, body) => {
      if (error) {
        console.error('Error Sending Action', error);
      } else if (response.body.error) {
        console.error('Error', response.body.error);
      }
      if (callback) {
        callback();
      }
    });
  }, 1000);
}

module.exports = {
  sendMessage,
  sendAction,
  subscribe
};
