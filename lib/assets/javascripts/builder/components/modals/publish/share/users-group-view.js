var CoreView = require('backbone/core-view');
var _ = require('underscore');
var template = require('./users-group.tpl');
var UserView = require('./user-view');

var REQUIRED_OPTS = [
  'users'
];

var MAX_USERS_TO_SHOW = 3;

module.exports = CoreView.extend({
  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      people: this._getRemainsPeople()
    }));
    this._renderUsers();
    return this;
  },

  _getRemainsPeople: function () {
    return Math.max(0, this._users.length - MAX_USERS_TO_SHOW);
  },

  _renderUsers: function () {
    _.each(this._users.slice(0, MAX_USERS_TO_SHOW), this._renderUser, this);
  },

  _renderUser: function (user) {
    var view = new UserView({
      username: user.username,
      avatar: user.avatar_url
    });

    this.$('.js-content').append(view.render().el);
    this.addView(view);
  }
});
