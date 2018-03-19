const ConfigModel = require('dashboard/data/config-model');

// Config model might as well be a singleton
const theConfig = new ConfigModel({
  sql_api_template: 'http://{user}.wadus.com',
  common_data_user: 'rick',
  account_host: 'wadus.com'
});

module.exports = theConfig;
