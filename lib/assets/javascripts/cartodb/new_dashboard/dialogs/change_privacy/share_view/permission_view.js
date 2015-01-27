var cdb = require('cartodb.js');
var _ = require('underscore');

/**
 * View to render an individual permission object.
 */
module.exports = cdb.core.View.extend({
  
  className: 'ChangePrivacy-shareListItem',
  
  events: {
    'click .js-write' : '_toggleWrite',
    'click .js-read' : '_toggleRead'
  },
  
  initialize: function() {
    this._canChangeWriteAccess = this.options.canChangeWriteAccess;
  },

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('new_dashboard/dialogs/change_privacy/share_view/permission_view_template')(
        _.defaults(this._templateVars(), {
          writeId: 'write-'+ this.cid,
          readId: 'read-'+ this.cid,
          canChangeWriteAccess: this._canChangeWriteAccess,
          avatarUrl: false
        })
      )
    );
    
    return this;
  },
  
  _templateVars: function() {
    throw new Error('Implement _templateVars on child view');
  },
  
  _toggleWrite: function() {
    if (this._canChangeWriteAccess) {
      console.log('rw');
    }
  },
  
  _toggleRead: function() {
    console.log('r');
  }
});
