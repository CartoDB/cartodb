var Engine = require('../../../src/engine');

function createEngine (opts) {
  opts = opts || {};
  var apiKey = opts.hasOwnProperty('apiKey')
    ? opts.apiKey
    : 'API_KEY';
  var authToken = opts.authToken || ['fabada', 'coffee'];
  var username = opts.username || 'wadus';
  var serverUrl = opts.serverUrl || 'http://example.com';
  var spyReload = opts.hasOwnProperty('spyReload')
    ? opts.spyReload
    : true;
  var client = opts.client || 'fake-client';

  var engine = new Engine({
    apiKey: apiKey,
    authToken: authToken,
    username: username,
    serverUrl: serverUrl,
    client: client
  });

  if (spyReload) {
    spyOn(engine, 'reload');
  }

  return engine;
}

module.exports = createEngine;
