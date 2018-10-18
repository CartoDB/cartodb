const Backbone = require('backbone');

/**
 * Header view model to handle state for dashboard header view.
 */

module.exports = Backbone.Model.extend({
  breadcrumbTitle: () => 'Configuration',

  isBreadcrumbDropdownEnabled: () => false
});
