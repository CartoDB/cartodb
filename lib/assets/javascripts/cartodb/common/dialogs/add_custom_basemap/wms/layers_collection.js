var Backbone = require('backbone');
var LayerModel = require('./layer_model.js');

module.exports = Backbone.Collection.extend({

  model: LayerModel,

  fetch: function(url, callback) {
    this.url = url;

    var wmsService = new cdb.admin.WMSService({
      wms_url: url
    });

    var self = this;
    wmsService.fetch().always(function() {
      self.reset(wmsService.get('layers'));
      callback();
    });
  }
});
