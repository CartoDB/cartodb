const ConfigModel = require('dashboard/data/config-model');

// Config model might as well be a singleton
const theConfig = new ConfigModel();

module.exports = theConfig;
