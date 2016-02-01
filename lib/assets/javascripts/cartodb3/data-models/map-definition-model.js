var cdb = require('cartodb.js');
var LayerDefinitionsCollection = require('./layer-definitions-collection');
var WidgetDefinitionsCollection = require('./widget-definitions-collection');

/**
 * Model that represents the map definition.
 */
module.exports = cdb.core.Model.extend({

  urlRoot: function () {
    return this.get('urlRoot') + '/api/v3/maps';
  },

  initialize: function () {
    if (!this.get('urlRoot')) throw new Error('urlRoot is required');

    var mapUrl = this.url.bind(this);

    this.layers = new LayerDefinitionsCollection();
    this.layers.url = function () {
      return mapUrl() + '/layers';
    };

    this.widgets = new WidgetDefinitionsCollection();
  }

});
