// NOTE: this configuration file MUST NOT be loaded with `-p` or `--optimize-minimize` option.
// This option includes an implicit call to UglifyJsPlugin and LoaderOptionsPlugin. Instead,
// an explicit call is made in this file to these plugins with customized options that enables
// more control of the output bundle in order to fix unexpected behavior in old browsers.
const platformConfig = require('./config/webpack.prod.config');
const newDashboardConfig = require('./new-dashboard/webpack.prod.config');

module.exports = [
  platformConfig,
  newDashboardConfig
];
