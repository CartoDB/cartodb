var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./share-permission.tpl');

var REQUIRED_OPTS = [
  'permission',
  'name',
  'hasReadAccess',
  'hasWriteAccessAvailable',
  'hasWriteAccess'
];

var OPTIONALS_OPT = [
  'description',
  'role',
  'avatar'
];

module.exports = CoreView.extend({
  className: 'Share-permission',

  events: {
    'change .js-read': '_onChangeRead',
    'change .js-write': '_onChangeWrite'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    _.each(OPTIONALS_OPT, function (item) {
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      name: this._name,
      avatar: this._avatar,
      role: this._role,
      description: this._description,
      hasWriteAccessAvailable: this._hasWriteAccessAvailable,
      hasWriteAccess: this._hasWriteAccess,
      hasReadAccess: this._hasReadAccess
    }));
    return this;
  },

  _onChangeWrite: function () {
    var p = this._permission;
    if (p.canChangeWriteAccess(this.model)) {
      if (p.hasWriteAccess(this.model)) {
        p.revokeWriteAccess(this.model);
      } else {
        p.grantWriteAccess(this.model);
      }
    }
  },

  _onChangeRead: function () {
    var p = this._permission;
    if (p.canChangeReadAccess(this.model)) {
      if (p.hasReadAccess(this.model)) {
        p.revokeAccess(this.model);
      } else {
        p.grantReadAccess(this.model);
      }
    }
  }

});
