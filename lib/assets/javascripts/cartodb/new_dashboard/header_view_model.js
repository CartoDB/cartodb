var cdb = require('cartodb.js');

/**
 * Header view model to handle state for dashboard header view.
 */
module.exports = cdb.core.Model.extend({

  initialize: function(router) {
    this.router = router;
    this.router.model.bind('change', this.trigger.bind(this, 'change')); // simple re-trigger
  },

  breadcrumbTitle: function() {
    var contentType = this.router.model.get('content_type');
    if (this.isDisplayingLockedItems()) {
      return 'Locked ' + contentType;
    } else {
      // Capitalize string
      return contentType && contentType[0].toUpperCase() + contentType.slice(1);
    }
  },

  isBreadcrumbDropdownEnabled: function() {
    return true;
  },

  isDisplayingDatasets: function() {
    return this.router.model.get('content_type') === 'datasets';
  },

  isDisplayingMaps: function() {
    return this.router.model.get('content_type') === 'maps';
  },

  isDisplayingLockedItems: function() {
    return !!this.router.model.get('locked');
  }
});
