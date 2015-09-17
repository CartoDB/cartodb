var _ = require('underscore');
var cdb = require('cartodb.js');
var GroupView = require('./group_view')

/**
 * Index view of groups to list groups of an organization
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    _.each(['groups', 'router', 'newGroupUrl'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      this.getTemplate('organization/groups_admin/groups_index')({
        createGroupUrl: this.options.router.rootUrl.urlToPath('new'),
      })
    );
    this.$el.append(
      this.make('ul', { class: 'OrganizationList' }, this._renderGroups())
    );
    return this;
  },

  _initBinds: function() {
    this.options.groups.on('reset', this.render, this);
  },

  _renderGroups: function() {
    return this.options.groups.map(function(m) {
      var view = new GroupView({
        model: m,
        newGroupUrl: this.options.newGroupUrl
      });
      this.addView(view);
      return view.render().el;
    }, this);
  }

});
