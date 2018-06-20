var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./share-with.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'visDefinitionModel',
  'userModel'
];

module.exports = CoreView.extend({
  className: 'Share-with u-flex u-alignCenter',

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.separationClass = opts.separationClass || '';
    this.avatarClass = opts.avatarClass || '';

    if (this.options.clickPrivacyAction) {
      this._clickPrivacyAction = this.options.clickPrivacyAction;
    }

    this._acl = this._visDefinitionModel.getPermissionModel().acl;
    this._initBinds();
  },

  render: function () {
    var people = this._getPeople();

    this.clearSubViews();
    this.$el.html(template({
      avatar: this._userModel.get('avatar_url'),
      people: people,
      avatarClass: this.avatarClass,
      separationClass: this.separationClass,
      hasAction: !!this._clickPrivacyAction
    }));
    this.$el.toggleClass('is-pointer', !!this._clickPrivacyAction);

    return this;
  },

  _getPeople: function () {
    var types = this._acl.pluck('type');
    if (types.indexOf('org') > -1) {
      return this._userModel.getOrganization().get('user_count') - 1;
    } else {
      var users = [];

      // Grab all ids from every group
      _.each(this._acl.where({type: 'group'}), function (group) {
        var entity = group.get('entity');
        Array.prototype.push.apply(users, entity.users.pluck('id'));
      }, this);

      // Grab all ids from every user
      _.each(this._acl.where({type: 'user'}), function (group) {
        var entity = group.get('entity');
        users.push(entity.get('id'));
      }, this);

      // remove current user id because it can be part of a group
      users = _.without(users, this._userModel.id);

      // counts unique ids
      return _.unique(users).length;
    }
  },

  _initBinds: function () {
    this._acl.on('fetch', this.render, this);
    this.add_related_model(this._acl);
  },

  _onClick: function () {
    this._clickPrivacyAction && this._clickPrivacyAction();
  }
});
