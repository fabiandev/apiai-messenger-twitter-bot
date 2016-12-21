'use strict';

const apiai = require('apiai');

module.exports = apiai(process.env.APIAI_ACCESS_TOKEN, {
  language: process.env.APIAI_LANG,
  requestSource: "fb"
});
