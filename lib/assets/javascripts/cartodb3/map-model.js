var cdb = require('cartodb.js');
var LayersCollection = require('./layers-collection');

module.exports = cdb.core.Model.extend({

  urlRoot: function () {
    return this.get('urlRoot') + '/maps';
  },

  initialize: function () {
    if (!this.get('urlRoot')) throw new Error('urlRoot is required');
    this.layers = new LayersCollection();
    this.layers.url = function () {
      return this.url() + '/layers';
    }.bind(this);
  }

});
