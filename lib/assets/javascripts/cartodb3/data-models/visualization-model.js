var cdb = require('cartodb.js');
var Backbone = require('backbone');
var LayerDefinitionsCollection = require('./layer-definitions-collection');

/**
 * Model that represents a visualization (v3)
 */
module.exports = cdb.core.Model.extend({

  urlRoot: function () {
    return this.get('urlRoot') + '/api/v3/maps';
  },

  initialize: function () {
    if (!this.get('urlRoot')) throw new Error('urlRoot is required');

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([], { baseUrl: this.url.bind(this) });
    this.widgetDefinitionsCollection = new Backbone.Collection();
  }

});
