var cdb = require('cartodb.js');
var navigateThroughRouter = require('../common/view_helpers/navigate_through_router');

/**
 * Header view when looking at details of a specific group.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': navigateThroughRouter
  },

  initialize: function() {
    _.each(['group', 'router'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.getTemplate('organization_groups/group_header')({
        backHref: this.options.router.rootUrl,
        title: this.options.group.get('display_name')
      })
    );
    return this;
  },

  _initBinds: function() {
    this.options.group.on('change:display_name', this.render, this);
    this.add_related_model(this.options.group);
  }

});
