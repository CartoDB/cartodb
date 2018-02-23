const Backbone = require('backbone');

/**
 * Header view model to handle state for dashboard header view.
 */

module.exports = Backbone.Model.extend({
  breadcrumbTitle: function () {
    return 'Configuration';
  },

  isBreadcrumbDropdownEnabled: function () {
    return false;
  },

  isDisplayingDatasets: function () {
    return false;
  },

  isDisplayingMaps: function () {
    return false;
  },

  isDisplayingLockedItems: function () {
    return false;
  }
});
