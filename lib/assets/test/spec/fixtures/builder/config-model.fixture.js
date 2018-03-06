var ConfigModel = require('builder/data/config-model');

function getConfigModelFixture (opts) {
  opts = opts || {};
  var baseUrl = opts.baseUrl || '/u/pepe';
  var username = opts.username || 'pepe';

  var configModel = new ConfigModel({
    sql_api_protocol: 'http',
    base_url: baseUrl,
    user_name: username
  });

  return configModel;
}

module.exports = getConfigModelFixture;
