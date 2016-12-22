'use strict';

function getSender(event, sender) {
  return sender ? sender : event.sender.id.toString();
}

module.exports = getSender;
