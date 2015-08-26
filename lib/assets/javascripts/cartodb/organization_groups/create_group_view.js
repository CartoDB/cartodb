var cdb = require('cartodb.js');
var navigateThroughRouter = require('../common/view_helpers/navigate_through_router');

/**
 * View to create a new group for an organization.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': navigateThroughRouter
  },

  initialize: function() {
    if (!this.options.groups) throw new Error('groups is required');
  },

  render: function() {
    this.$el.html('').append(
      this.make('a', {
        href: this.options.router.rootUrl,
        class: 'js-back'
      }, 'back')
    );
    return this;
  }
});
