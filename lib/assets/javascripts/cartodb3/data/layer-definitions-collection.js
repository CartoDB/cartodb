var _ = require('underscore');
var Backbone = require('backbone');
var LayerDefinitionModel = require('./layer-definition-model');

/**
 * Collection of layer definitions
 */
module.exports = Backbone.Collection.extend({

  model: LayerDefinitionModel,

  initialize: function (models, options) {
    if (!options.baseUrl) throw new Error('baseUrl is required');
    this._baseUrl = options.baseUrl;
  },

  url: function () {
    return _.result(this, '_baseUrl') + '/layers';
  }

});
