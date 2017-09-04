var cdb = require('cartodb.js-v3');

/**
 * Header view model to handle state for profile header view.
 */
module.exports = cdb.core.Model.extend({

  breadcrumbTitle: function() {
    return 'Configuration';
  },

  isBreadcrumbDropdownEnabled: function() {
    return false;
  },

  isDisplayingDatasets: function() {
    return false;
  },

  isDisplayingMaps: function() {
    return false;
  },

  isDisplayingLockedItems: function() {
    return false;
  }

});
