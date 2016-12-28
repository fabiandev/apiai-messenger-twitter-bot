'use strict';

const helpers = require('../helpers');
const storage = require('../services/storage');
const messenger = require('../services/messenger');
const responseHandler = require('./response');

function onIntent(result, sender, event) {
  let name = result.metadata.intentName;
  let action = result.action;

  if (typeof name === 'string') {
    let toCall = `on${helpers.capitalizeFirstLetter(name.toLowerCase())}`;

    if (typeof responseHandler[toCall] === 'function') {
      return responseHandler[toCall](sender, result);
    }
  }

  responseHandler.onDefault(sender, result);
}

module.exports = {
  onIntent
};
