var cdb = require('cartodb.js-v3');

/**
 * Header view model to handle state for account, and profile header view
 */
module.exports = cdb.core.Model.extend({
  breadcrumbTitle: function () {
    return 'Configuration';
  },

  isBreadcrumbDropdownEnabled: function () {
    return false;
  }
});
