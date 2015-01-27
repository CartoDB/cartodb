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

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('new_dashboard/dialogs/change_privacy/share_view/permission_view_template')(
        _.defaults(this._templateVars(), {
          writeId: 'write-'+ this.cid,
          readId: 'read-'+ this.cid,
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
  },
  
  _toggleRead: function() {
  }
});
