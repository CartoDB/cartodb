var Backbone = require('backbone');
var LayerModel = require('./layer-model.js');
var WMSServiceModel = require('../../../../data/wms-service-model');

module.exports = Backbone.Collection.extend({

  model: LayerModel

});
