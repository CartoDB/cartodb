var _ = require('underscore');
var UserModel = require('builder/data/user-model');
var getConfigModelFixture = require('./config-model.fixture');

function getUserModelFixture (opts) {
  var custom = opts || {};
  var defaults = {
    username: 'pepe',
    actions: {
      private_tables: true
    },
    twitter: {
      quota: 100,
      monthly_use: 0,
      block_size: 10,
      block_price: 1000,
      enabled: true,
      hard_limit: false,
      customized_config: true
    }
  };
  var modelParams = _.extend(defaults, custom);

  var userModel = new UserModel(modelParams, {
    configModel: getConfigModelFixture()
  });
  return userModel;
}

module.exports = getUserModelFixture;
