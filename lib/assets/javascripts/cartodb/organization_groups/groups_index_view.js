var cdb = require('cartodb.js');
var navigateThroughRouter = require('../common/view_helpers/navigate_through_router');

/**
 * Index view of groups to list groups of an organization
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-new-group': navigateThroughRouter
  },

  initialize: function() {
    if (!this.options.groups) throw new Error('groups is required');
    if (!this.options.router) throw new Error('router is required');
  },

  render: function() {
    this.$el.html('').append(
      this.make('h3', {}, 'Groups'),
      this.make('a', {
        class: 'js-new-group',
        href: this.options.router.rootUrl.urlToPath('new')
      }, 'Create new group')
    );
    return this;
  }
});
