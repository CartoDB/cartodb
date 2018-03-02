var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var LegendDefinitionModel = require('builder/data/legends/legend-bubble-definition-model');

describe('data/legends/legend-bubble-defintion-model', function () {
  var style;
  var layerDef1;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    layerDef1 = new Backbone.Model({
      id: 'fa6cf872-fffa-4301-9a60-849cedba7864',
      table_name: 'foo',
      autoStyle: false
    });

    style = new Backbone.Model();
    style.hasNoneStyles = function () {
      return false;
    };
    layerDef1.styleModel = style;

    this.model = new LegendDefinitionModel(null, {
      configModel: configModel,
      layerDefinitionModel: layerDef1,
      vizId: 'v-123'
    });

    spyOn(this.model, '_inheritStyleColor');
    spyOn(this.model, 'save');
  });
});
