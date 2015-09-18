var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * View to change permission for a given model.
 */
module.exports = cdb.core.View.extend({

  className: 'ChangePrivacy-shareListItem',

  events: {
    'change .js-write' : '_toggleWrite',
    'change .js-read' : '_toggleRead'
  },

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
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/change_privacy/share/permission')({
        writeId: 'write-'+ this.cid,
        readId: 'read-'+ this.cid,
        hasReadAccess: this.options.permission.hasReadAccess(this.model),
        hasWriteAccess: this.options.permission.hasWriteAccess(this.model),
        canChangeReadAccess: this.options.permission.canChangeReadAccess(this.model),
        canChangeWriteAccess: this.options.permission.canChangeWriteAccess(this.model),
        isWriteAccessTogglerAvailable: this.options.isWriteAccessTogglerAvailable,
      })
    );
    this._renderDetails();
    return this;
  },

  _renderDetails: function() {
    this.addView(this.options.detailsView);
    this.$el.prepend(this.options.detailsView.render().el)
  },

  _toggleWrite: function(ev) {
    this.killEvent(ev);
    var p = this.options.permission;
    if (p.canChangeWriteAccess(this.model)) {
      if (p.hasWriteAccess(this.model)) {
        p.revokeWriteAccess(this.model);
      } else {
        p.grantWriteAccess(this.model);
      }
    }
  },

  _toggleRead: function(ev) {
    this.killEvent(ev);
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
