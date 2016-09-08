var Backbone = require('backbone');
var LayerModel = require('./layer-model.js');
var WMSService = require('../../../../data/wms-service-model');

module.exports = Backbone.Collection.extend({

  model: LayerModel,

  fetch: function (url, callback) {
    var self = this;

    this.url = url;

    var wmsService = new WMSService({
      wms_url: url
    });

    wmsService.fetch().always(function () {
      self.reset(wmsService.get('layers'));
      self.each(function (model) {
        model.set('type', wmsService.get('type')); // wms/wmts
      });
      callback();
    });
  }

});
