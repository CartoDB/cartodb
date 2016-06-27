var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var PermissionTogglerview = require('./permission_toggler_view');
var ViewFactory = require('../../../view_factory');

/**
 * View to change permission for a given model.
 */
module.exports = cdb.core.View.extend({

  className: 'ChangePrivacy-shareListItem',

  initialize: function() {
    _.each(['model', 'permission', 'isWriteAccessTogglerAvailable', 'detailsView'], function(name) {
      if (_.isUndefined(this.options[name])) throw new Error(name + ' is required');
    }, this);

    this._initBinds();
  },

  _initBinds: function() {
    this.options.permission.acl.bind('add remove reset change', this.render, this);
    this.add_related_model(this.options.permission);
  },

  render: function() {
    this.clearSubViews();
    this._renderDetails();
    this._renderAccessTogglers();
    return this;
  },

  _renderDetails: function() {
    this._renderView(this.options.detailsView);
  },

  _renderAccessTogglers: function() {
    var togglers = [
      this._newReadToggler()
    ];

    if (this.options.isWriteAccessTogglerAvailable) {
      togglers.unshift(this._newWriteToggler());
    }

    this._renderView(ViewFactory.createByList(togglers));
  },

  _newWriteToggler: function() {
    var p = this.options.permission;
    return new PermissionTogglerview({
      className: 'ChangePrivacy-shareListItemTogglerContainer',
      model: this.model,
      permission: p,
      label: 'Write',
      hasAccess: p.hasWriteAccess.bind(p, this.model),
      canChangeAccess: p.canChangeWriteAccess.bind(p, this.model),
      toggleAccess: this._toggleWrite.bind(this)
    });
  },

  _newReadToggler: function() {
    var p = this.options.permission;
    return new PermissionTogglerview({
      model: this.model,
      permission: p,
      label: 'Read',
      hasAccess: p.hasReadAccess.bind(p, this.model),
      canChangeAccess: p.canChangeReadAccess.bind(p, this.model),
      toggleAccess: this._toggleRead.bind(this)
    });
  },

  _renderView: function(view) {
    this.addView(view);
    this.$el.append(view.render().el)
  },

  _toggleWrite: function() {
    var p = this.options.permission;
    if (p.canChangeWriteAccess(this.model)) {
      if (p.hasWriteAccess(this.model)) {
        p.revokeWriteAccess(this.model);
      } else {
        p.grantWriteAccess(this.model);
      }
    }
  },

  _toggleRead: function() {
    var p = this.options.permission;
    if (p.canChangeReadAccess(this.model)) {
      if (p.hasReadAccess(this.model)) {
        p.revokeAccess(this.model);
      } else {
        p.grantReadAccess(this.model);
      }
    }
  }

});
