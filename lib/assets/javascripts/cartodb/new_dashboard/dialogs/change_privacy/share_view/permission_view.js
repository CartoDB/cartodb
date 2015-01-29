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

    this._permission.acl.bind('add remove reset change', this.render, this);
    this.add_related_model(this._permission);
  },

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('new_dashboard/dialogs/change_privacy/share_view/permission_view_template')({
        writeId: 'write-'+ this.cid,
        readId: 'read-'+ this.cid,
        canRead: this._canRead(),
        canWrite: this._canWrite(),
        canChangeWriteAccess: this.options.canChangeWriteAccess,
        title: this.options.title,
        desc: this.options.desc,
        avatarUrl: this.options.avatarUrl
      })
    );
    
    return this;
  },
  
  _toggleWrite: function() {
    if (this.options.canChangeWriteAccess) {
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
