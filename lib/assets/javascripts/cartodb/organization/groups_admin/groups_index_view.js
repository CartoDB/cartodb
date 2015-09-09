var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * Index view of groups to list groups of an organization
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    _.each(['groups', 'router'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
    this._initBinds();
  },

  render: function() {
    this.$el.html('').append(
      this.getTemplate('organization/groups_admin/groups_index')({
        createGroupUrl: this.options.router.rootUrl.urlToPath('new')
      }),
      this.options.groups.map(this._makeGroupItem, this)
    );
    return this;
  },

  _initBinds: function() {
    this.options.groups.on('reset', this.render, this);
  },

  _makeGroupItem: function(m) {
    return this.make('div', {},
      this.make('a', { href: this._groupUrl(m) }, m.get('display_name'))
    );
  },

  _groupUrl: function(group) {
    return this.options.router.rootUrl.urlToPath(group.get('id'));
  }
});
