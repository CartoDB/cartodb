const Backbone = require('backbone');

/**
 * Header view model to handle state for dashboard header view.
 */
module.exports = Backbone.Model.extend({
  initialize: function (router) {
    this.router = router;
    this.router.model.bind('change', this.trigger.bind(this, 'change')); // simple re-trigger
  },

  breadcrumbTitle: function () {
    var contentType = this.router.model.get('content_type');
    if (this.isDisplayingLockedItems()) {
      return 'Locked ' + contentType;
    } else if (this.isDisplayingDeepInsights()) {
      return 'Deep insights';
    } else {
      // Capitalize string
      return contentType && contentType[0].toUpperCase() + contentType.slice(1);
    }
  },

  isBreadcrumbDropdownEnabled: () => true,

  isDisplayingDatasets: () => this.router.model.get('content_type') === 'datasets',

  isDisplayingMaps: () => this.router.model.get('content_type') === 'maps',

  isDisplayingLockedItems: () => !!this.router.model.get('locked'),

  isDisplayingDeepInsights: () => this.router.model.isDeepInsights()
});
