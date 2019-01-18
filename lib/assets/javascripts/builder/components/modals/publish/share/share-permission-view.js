var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./share-permission.tpl');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view.js');
var $ = require('jquery');
var UsersGroup = require('./users-group-view');

var REQUIRED_OPTS = [
  'model',
  'permission',
  'name',
  'canChangeReadAccess',
  'hasReadAccess',
  'hasWriteAccessAvailable',
  'canChangeWriteAccess',
  'hasWriteAccess',
  'isSelected'
];

var OPTIONALS_OPT = [
  'description',
  'role',
  'avatar',
  'users'
];

module.exports = CoreView.extend({
  className: 'Share-permission',

  events: {
    'change .js-read': '_onChangeRead',
    'change .js-write': '_onChangeWrite',
    'mouseover .js-toggler.is-disabled': '_onHoverDisabledToggler',
    'mouseout .js-toggler': '_destroyTooltip',
    'mouseleave .js-toggler': '_destroyTooltip'
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
      users: this._users,
      description: this._description,
      canChangeReadAccess: this._canChangeReadAccess,
      hasReadAccess: this._hasReadAccess,
      hasWriteAccessAvailable: this._hasWriteAccessAvailable,
      canChangeWriteAccess: this._canChangeWriteAccess,
      hasWriteAccess: this._hasWriteAccess
    }));

    if (this._users) {
      this._renderUsers();
    }

    this.$el.toggleClass('is-selected', this._isSelected);
    return this;
  },

  _renderUsers: function () {
    var view = new UsersGroup({
      className: 'u-flex u-alignCenter',
      users: this._users
    });

    this.$('.js-users').append(view.render().el);
    this.addView(view);
  },

  _onChangeWrite: function () {
    var p = this._permission;
    if (p.canChangeWriteAccess(this._model)) {
      if (p.hasWriteAccess(this._model)) {
        p.revokeWriteAccess(this._model);
      } else {
        p.grantWriteAccess(this._model);
      }
    }
  },

  _onChangeRead: function () {
    var p = this._permission;
    if (p.canChangeReadAccess(this._model)) {
      if (p.hasReadAccess(this._model)) {
        p.revokeAccess(this._model);
      } else {
        p.grantReadAccess(this._model);
      }
    }
  },

  _onHoverDisabledToggler: function (e) {
    var aclItem = this._permission.findRepresentableAclItem(this._model);
    var msg;
    var $el;

    if (aclItem && !aclItem.isOwn(this._model)) {
      msg = this._inheritedAccessTooltipText(aclItem);
      $el = $(e.currentTarget);

      this._tooltip = this._createTooltip({
        $el: $el,
        msg: msg
      });
      this._tooltip.showTipsy();
    }
  },

  _createTooltip: function (opts) {
    return new TipsyTooltipView({
      el: opts.$el,
      title: function () {
        return opts.msg;
      }
    });
  },

  _destroyTooltip: function () {
    if (this._tooltip) {
      this._tooltip.hideTipsy();
      this._tooltip.destroyTipsy();
    }
  },

  _inheritedAccessTooltipText: function (aclItem) {
    var type = aclItem.get('type');

    switch (type) {
      case 'group':
        return _t('components.modals.publish.share.tooltip.group', {
          name: aclItem.get('entity').get('name')
        });
      case 'org':
        return _t('components.modals.publish.share.tooltip.org');
      default:
        console.error('Trying to display inherited access for an unrecognized type ' + type);
        return '';
    }
  }

});
