var cdb = require('cartodb.js');
var LayersCollection = require('./layers-collection');
var EdWidgetsCollection = require('./editor-widgets-collection');

module.exports = cdb.core.Model.extend({

  urlRoot: function () {
    return this.get('urlRoot') + '/api/v3/maps';
  },

  initialize: function () {
    if (!this.get('urlRoot')) throw new Error('urlRoot is required');

    var mapUrl = this.url.bind(this);

    this.layers = new LayersCollection();
    this.layers.url = function () {
      return mapUrl() + '/layers';
    };

    this.widgets = new EdWidgetsCollection();
  }

});
