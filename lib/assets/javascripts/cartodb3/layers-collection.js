var Backbone = require('backbone');
var LayerModel = require('./layer-model');

module.exports = Backbone.Collection.extend({

  model: LayerModel,

  url: function () {
    throw new Error('creator of this collection should define the URL');
  }

});
