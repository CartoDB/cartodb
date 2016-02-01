var Backbone = require('backbone');
var LayerDefinitionModel = require('./layer-definition-model');

/**
 * Collection of layer definitions
 */
module.exports = Backbone.Collection.extend({

  model: LayerDefinitionModel,

  url: function () {
    throw new Error('creator of this collection should define the URL');
  }

});
