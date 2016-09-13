var Backbone = require('backbone');
var LayerModel = require('./layer-model');

module.exports = Backbone.Collection.extend({

  model: LayerModel,

  initialize: function(models, opts) {
    if (opts && opts.url) {
      this.url = opts.url;
    }
  }

});
