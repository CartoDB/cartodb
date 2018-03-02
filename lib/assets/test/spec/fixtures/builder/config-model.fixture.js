var ConfigModel = require('builder/data/config-model');

function getConfigModelFixture (opts) {
  var configModel = new ConfigModel({
    sql_api_protocol: 'http'
  });

  return configModel;
}

module.exports = getConfigModelFixture;
