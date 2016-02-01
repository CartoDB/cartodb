var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var XYZView = require('./xyz_view');

/**
 * View model for XYZ tab content.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'xyz',
    label: 'XYZ',
    tms: false,
    layer: undefined // will be set when valid
  },

  createView: function() {
    return new XYZView({
      model: this
    });
  },

  hasAlreadyAddedLayer: function(baseLayers) {
    var urlTemplate = this.get('layer').get('urlTemplate');
    return _.any(baseLayers.custom(), function(customLayer) {
      return customLayer.get('urlTemplate') === urlTemplate;
    });
  }
});
