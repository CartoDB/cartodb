var cdb = require('cartodb.js');

/**
 *  Import fallback default panel
 *
 */

module.exports = cdb.core.View.extend({

  className: 'ImportPanel',

  initialize: function() { 
    this.template = cdb.templates.getTemplate(this.options.template);
  },

  render: function() {
    this.$el.append(this.template());
  }

})