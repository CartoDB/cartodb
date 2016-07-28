var CoreView = require('backbone/core-view');
var _ = require('underscore');
var template = require('./share-with.tpl');

var REQUIRED_OPTS = [
  'visDefinitionModel',
  'userModel'
];

module.exports = CoreView.extend({
  className: 'Share-with u-flex u-alignCenter',

  events: {
    'click .js-action': '_onAction'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this.separationClass = opts.separationClass || '';
    this.avatarClass = opts.avatarClass || '';
    this._acl = this._visDefinitionModel._permissionModel.acl;

    this._initBinds();
  },

  render: function () {
    var people = this._acl.length;
    this.clearSubViews();
    this.$el.html(template({
      avatar: this._userModel.get('avatar_url'),
      people: people,
      avatarClass: this.avatarClass,
      separationClass: this.separationClass,
      hasAction: this.options.action !== undefined
    }));
    return this;
  },

  _initBinds: function () {
    this._acl.on('reset', this.render, this);
    this.add_related_model(this._acl);
  },

  _onAction: function () {
    this.options.action && this.options.action();
  }
});
