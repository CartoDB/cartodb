var cdb = require('cartodb.js');

/**
 *  Create listing view
 *
 *  It will display all the possibilities to select
 *  any of your current datasets or connect a new dataset.
 *
 */

module.exports = cdb.core.View.extend({

  className: 'CreateDialog-listing',

  events: {
    
  },
  
  initialize: function() {
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_common/views/create/create_listing');
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