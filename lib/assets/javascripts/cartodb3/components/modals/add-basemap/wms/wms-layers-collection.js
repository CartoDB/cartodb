var Backbone = require('backbone');
var WMSLayerModel = require('./wms-layer-model');

module.exports = Backbone.Collection.extend({

  model: WMSLayerModel,

  initialize: function(models, opts) {
    if (opts && opts.url) {
      this.url = opts.url;
    }
  }

});
