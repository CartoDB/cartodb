var cdb = require('cartodb.js-v3');

/**
 *  Import fallback default panel
 *
 */

module.exports = cdb.core.View.extend({

  className: 'ImportPanel',

  initialize: function() { 
    this.template = cdb.templates.getTemplate( this.options.template || 'common/views/create/listing/import_default_fallback' );
  },

  render: function() {
    this.$el.append(this.template());
  }

})