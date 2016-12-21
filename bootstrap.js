'use strict';

const path = require('path');
const env = require('node-env-file');

const defaultOptions = {
  envFile: path.join(__dirname, '.env')
}

function bootstrap(options) {
  options = options || defaultOptions;

  env(options.envFile, {
    raise: false
  });
}

module.exports = bootstrap;
