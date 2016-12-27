var Backbone = require('backbone');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var LegendDefinitionModel = require('../../../../../javascripts/cartodb3/data/legends/legend-bubble-definition-model');

describe('data/legends/legend-bubble-defintion-model', function () {
  var style;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var layerDef1 = new Backbone.Model({
      id: 'fa6cf872-fffa-4301-9a60-849cedba7864',
      table_name: 'foo'
    });

    style = new Backbone.Model();
    layerDef1.styleModel = style;

    this.model = new LegendDefinitionModel(null, {
      configModel: configModel,
      layerDefinitionModel: layerDef1,
      vizId: 'v-123'
    });

    spyOn(this.model, '_inheritStyleColor');
  });

  it('should _inheritStyleColor on custom autostyle', function () {
    style.trigger('style:update');
    expect(this.model._inheritStyleColor).toHaveBeenCalled();
  });
});
