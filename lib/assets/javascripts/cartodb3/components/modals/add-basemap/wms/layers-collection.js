var Backbone = require('backbone');
var LayerModel = require('./layer-model.js');
var WMSServiceModel = require('../../../../data/wms-service-model');

module.exports = Backbone.Collection.extend({

  model: LayerModel,

  initialize: function (models, opts) {
    this.WMSServiceModel = WMSServiceModel;
  },

  fetch: function (url, callback) {
    var self = this;

    this.url = url;

    this.wms = new this.WMSServiceModel({
      wms_url: url
    });

    this.wms.fetch().always(function () {
      self.reset(self.wms.get('layers'));
      self.each(function (model) {
        model.set('type', self.wms.get('type')); // wms/wmts
      });
      callback();
    });
  }

});
