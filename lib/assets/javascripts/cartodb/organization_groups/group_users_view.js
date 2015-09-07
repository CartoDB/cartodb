var _ = require('underscore');
var cdb = require('cartodb.js');
var ViewFactory = require('../common/view_factory');

/**
 * View of group users
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    _.each(['orgUsers'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this._renderUsers();
    return this;
  },

  _initBinds: function() {
    this.options.orgUsers.bind('reset', this.render, this);
    this.add_related_model(this.options.orgUsers);
  },

  _renderUsers: function() {
    this.options.orgUsers.each(this._createUserView, this);
  },

  _createUserView: function(m) {
    var view = ViewFactory.createByTemplate('organization_groups/group_user_view', {
      username: m.get('username')
    });
    this.addView(view);
    this.$el.append(view.render().el);
  }

});
