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
    _.each(['model', 'permission', 'canChangeWriteAccess', 'detailsView'], function(name) {
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
        canRead: this._canRead(),
        canWrite: this._canWrite(),
        canChangeWriteAccess: this.options.canChangeWriteAccess,
      })
    );
    this._renderDetails();
    return this;
  },

  _renderDetails: function() {
    this.addView(this.options.detailsView);
    this.$el.prepend(this.options.detailsView.render().el)
  },

  _toggleWrite: function() {
    if (this.options.canChangeWriteAccess) {
      var newAccess = this._canWrite() ? 'READ_ONLY' : 'READ_WRITE';
      this._setPermission(cdb.admin.Permission[newAccess])
    }
  },

  _toggleRead: function() {
    if (this._canRead()) {
      this.options.permission.removePermission(this.model);
    } else {
      this._setPermission(cdb.admin.Permission.READ_ONLY)
    }
  },

  _canRead: function() {
    return this.options.permission.canRead(this.model);
  },

  _canWrite: function() {
    return this.options.permission.canWrite(this.model);
  },

  _setPermission: function(newPermission) {
    this.options.permission.setPermission(this.model, newPermission);
  }
});
