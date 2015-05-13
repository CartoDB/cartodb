var cdb = require('cartodb.js');
var _ = require('underscore');

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
    this._permission = this.options.permission;
    this._isUsingVis = this.options.isUsingVis;
    this._title = this.options.title;
    this._desc = this.options.desc;
    this._avatarUrl = this.options.avatarUrl;
    this._canChangeWriteAccess = this.options.canChangeWriteAccess;

    this._permission.acl.bind('add remove reset change', this.render, this);
    this.add_related_model(this._permission);
  },

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/change_privacy/share/permission_view_template')({
        writeId: 'write-'+ this.cid,
        readId: 'read-'+ this.cid,
        canRead: this._canRead(),
        canWrite: this._canWrite(),
        canChangeWriteAccess: this._canChangeWriteAccess,
        title: this._title,
        desc: this._descStr(),
        avatarUrl: this._avatarUrl,
        willRevokeAccess: this._willRevokeAccess()
      })
    );

    return this;
  },

  _willRevokeAccess: function() {
    return this._isUsingVis && !this._canRead();
  },

  _descStr: function() {
    if (this._isUsingVis) {
      var desc = this._desc || 'this user';
      if (this._canRead()) {
        return desc +' is using this dataset';
      } else {
        return desc +"'s maps will be affected";
      }
    } else {
      return this._desc || '';
    }
  },

  _toggleWrite: function() {
    if (this._canChangeWriteAccess) {
      if (this._canWrite()) {
        this._permission.setPermission(this.model, cdb.admin.Permission.READ_ONLY);
      } else {
        this._permission.setPermission(this.model, cdb.admin.Permission.READ_WRITE);
      }
    }
  },

  _toggleRead: function() {
    if (this._canRead()) {
      this._permission.removePermission(this.model);
    } else {
      this._permission.setPermission(this.model, cdb.admin.Permission.READ_ONLY);
    }
  },

  _canRead: function() {
    return this._permission.canRead(this.model);
  },

  _canWrite: function() {
    return this._permission.canWrite(this.model);
  }
});
