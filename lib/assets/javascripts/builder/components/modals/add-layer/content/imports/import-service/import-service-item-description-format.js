var Utils = require('builder/helpers/utils');

/**
 *  Service list item format utils
 *
 *  - Create customized functions for service list items.
 *
 */

module.exports = {
  // Due to the fact that backend data source service
  // returns 0 size when it doesn't know it
  formatSize: function (s) {
    if (s && s > 0) {
      return Utils.readablizeBytes(s);
    } else {
      return 'Unknown';
    }
  }
};
