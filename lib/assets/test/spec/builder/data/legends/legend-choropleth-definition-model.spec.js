var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var LegendDefinitionModel = require('builder/data/legends/legend-choropleth-definition-model');

describe('data/legends/legend-choropleth-defintion-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var layerDef1 = new Backbone.Model({
      id: 'fa6cf872-fffa-4301-9a60-849cedba7864',
      table_name: 'foo'
    });

    this.model = new LegendDefinitionModel(null, {
      configModel: configModel,
      layerDefinitionModel: layerDef1,
      vizId: 'v-123'
    });
  });

  it('should toJSON properly', function () {
    var attrs = this.model.toJSON();
    expect(attrs.definition).toBeDefined();
    expect(_.isEmpty(attrs.definition)).toBe(true);

    this.model.set({prefix: 'foo'});
    attrs = this.model.toJSON();
    expect(attrs.definition.prefix).toBeDefined();
    expect(attrs.definition.suffix).toBeUndefined();

    this.model.set({suffix: 'bar'});
    attrs = this.model.toJSON();
    expect(attrs.definition.prefix).toBe('foo');
    expect(attrs.definition.suffix).toBe('bar');
  });
});
