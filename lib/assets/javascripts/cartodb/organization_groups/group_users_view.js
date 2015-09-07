var _ = require('underscore');
var cdb = require('cartodb.js');
var GroupUserView = require('./group_user_view');

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

  _createUserView: function(user) {
    var view = new GroupUserView({
      model: user
    })
    this.addView(view);
    this.$el.append(view.render().el);
  }

});
