var cdb = require('cartodb.js');
var navigateThroughRouter = require('../common/view_helpers/navigate_through_router');

/**
 * Index view of groups to list groups of an organization
 */
module.exports = cdb.core.View.extend({

  events: {
    'click a': navigateThroughRouter
  },

  initialize: function() {
    if (!this.options.groups) throw new Error('groups is required');
    if (!this.options.router) throw new Error('router is required');
    this._initBinds();
  },

  render: function() {
    this.$el.html('').append(
      this.make('h3', {}, 'Groups'),

      this.options.groups.map(this._makeGroupItem, this),

      this.make('a', {
        class: 'js-new-group',
        href: this.options.router.rootUrl.urlToPath('new')
      }, 'Create new group')
    );
    return this;
  },

  _initBinds: function() {
    this.options.groups.bind('reset', this.render, this);
  },

  _makeGroupItem: function(m) {
    return this.make('div', {},
      this.make('a', { href: this._editUrl(m) }, m.get('display_name'))
    );
  },

  _editUrl: function(group) {
    return this.options.router.rootUrl.urlToPath('edit/' + group.get('id'));
  }
});
