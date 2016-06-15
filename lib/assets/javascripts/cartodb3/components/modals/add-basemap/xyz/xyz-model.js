var Backbone = require('backbone');

/**
 * View model for XYZ tab content.
 */
module.exports = Backbone.Model.extend({

  defaults: {
    name: 'xyz',
    label: 'XYZ',
    tms: false,
    layer: undefined // will be set when valid
  }

});
