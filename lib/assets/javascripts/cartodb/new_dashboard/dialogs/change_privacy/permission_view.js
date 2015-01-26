var cdb = require('cartodb.js');

/**
 * View to render an individual permission object.
 */
module.exports = cdb.core.View.extend({
  
  events: {
    'click .js-write' : '_toggleWrite',
    'click .js-read' : '_toggleRead'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('new_dashboard/dialogs/change_privacy/permission_view_template');
    this.model.bind('change', this.render, this);
  },

  render: function() {
    this.$el.html(
      this.template({
        model: this.model,
        writeId: 'write-'+ this.cid,
        readId: 'read-'+ this.cid
      })
    );
    
    return this;
  },
  
  _toggleWrite: function() {
    this.model.toggleWrite();
  },
  
  _toggleRead: function() {
    this.model.toggleRead();
  }
});
