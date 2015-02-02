var cdb = require('cartodb.js');

/**
 *  Create templates view
 *
 *  It will display all template options for creating
 *  a new map.
 *
 */

module.exports = cdb.core.View.extend({

  className: 'CreateDialog-templates',

  events: {
    
  },
  
  initialize: function() {
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_common/views/create/create_templates');
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.template()
    );
    return this;
  },

  _initBinds: function() {
    
  }

});