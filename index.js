'use strict';

const bootstrap = require('./bootstrap');
const server = require('./lib/server');

bootstrap();
server.listen();
