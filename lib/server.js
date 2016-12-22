'use strict';

const bodyParser = require('body-parser');
const express = require('express');

const messenger = require('./services/messenger');
const webhookHandler = require('./handlers/webhook');

const app = express();

app.use(bodyParser.text({
  type: 'application/json'
}));

app.get('/webhook/', (req, res) => {
  res.send(webhookHandler.onGet(req).result);
});

app.post('/webhook/', (req, res) => {
  let result = webhookHandler.onPost(req);

  if (result.success === true) {
    return res.status(200).json({
      status: "ok"
    });
  }

  res.status(400).json({
    status: "error",
    error: result.result
  });
});

function listen(port) {
  port = port || process.env.PORT;

  app.listen(port, () => {
    console.log(`REST service ready on port ${port}`);
  });

  messenger.subscribe();
}

module.exports = {
  listen
};
