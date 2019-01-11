const platformConfig = require('./config/webpack.dev.config');
const newDashboardConfig = require('./new-dashboard/webpack.dev.config');

module.exports = [
  platformConfig,
  newDashboardConfig
];
