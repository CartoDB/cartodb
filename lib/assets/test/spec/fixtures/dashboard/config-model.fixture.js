const ConfigModel = require('dashboard/data/config-model');

// Config model might as well be a singleton
const theConfig = new ConfigModel({
  sql_api_template: 'http://{user}.wadus.com',
  common_data_user: 'rick',
  account_host: 'wadus.com',
  maps_api_template: 'http://localhost:9000'
});

module.exports = theConfig;
