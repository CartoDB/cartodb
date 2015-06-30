var cdb = require('cartodb.js');
var Backbone = require('backbone');

/**
 *  Visualization template model
 *
 *  - It will contain the information about
 *  an already created visualization template.
 *
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    visualization_parent_id: '',
    name: 'Map template',
    description: '',
    times_used: 0
  },

  initialize: function() {
    this.steps = new Backbone.Collection();
  }

})