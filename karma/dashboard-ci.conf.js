// Karma CI configuration for Dashboard
const karmaDashboardConfiguration = require('./dashboard.conf');

module.exports = function (config) {
  karmaDashboardConfiguration(config);

  // Override Karma configuration with CI config
  config.set({
    browsers: ['ChromeHeadless'],
    singleRun: true
  });
};
