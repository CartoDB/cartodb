var ConfigModel = require('builder/data/config-model');
var _ = require('underscore');

function getConfigModelFixture (opts) {
  opts = opts || {};
  var baseUrl = opts.baseUrl || '/u/pepe';
  var username = opts.username || 'pepe';

  var defaults = {
    sql_api_protocol: 'http',
    base_url: baseUrl,
    user_name: username
  };

  var modelParams = _.extend(defaults, opts);

  var configModel = new ConfigModel(modelParams);

  return configModel;
}

module.exports = getConfigModelFixture;
