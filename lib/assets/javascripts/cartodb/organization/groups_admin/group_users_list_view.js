var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var GroupUserView = require('./group_user_view');

/**
 * View of group users.
 */
module.exports = cdb.core.View.extend({

  tagName: 'ul',
  className: 'OrganizationList',

  initialize: function () {
    _.each(['users'], function (name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

    // init binds
    this.options.users.bind('reset add remove', this.render, this);
    this.add_related_model(this.options.users);
  },

  render: function () {
    this.clearSubViews();
    this._renderUsers();
    return this;
  },

  _renderUsers: function () {
    this.options.users.each(this._createUserView, this);
  },

  _createUserView: function (user) {
    var view = new GroupUserView({
      model: user
    });

    this.addView(view);
    this.$el.append(view.render().el);
  }

});
