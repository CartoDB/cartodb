var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var LegendCustomChoroplethDefinitionModel = require('builder/data/legends/legend-custom-choropleth-definition-model');

describe('data/legends/legend-choropleth-defintion-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var layerDef1 = new Backbone.Model({
      id: 'fa6cf872-fffa-4301-9a60-849cedba7864',
      table_name: 'foo'
    });

    this.model = new LegendCustomChoroplethDefinitionModel(null, {
      configModel: configModel,
      layerDefinitionModel: layerDef1,
      vizId: 'v-123'
    });
  });

  it('should toJSON properly', function () {
    var attrs = this.model.toJSON();
    expect(attrs.definition).toBeDefined();
    expect(attrs.definition.prefix).toBeUndefined();
    expect(attrs.definition.suffix).toBeUndefined();
    expect(attrs.definition.left_label).toBeUndefined();
    expect(attrs.definition.right_Label).toBeUndefined();
    expect(attrs.definition.colors.length).toBe(0);

    this.model.set({ prefix: 'foo', suffix: 'bar', leftLabel: 'low', rightLabel: 'high' });
    attrs = this.model.toJSON();
    expect(attrs.definition.prefix).toBe('foo');
    expect(attrs.definition.suffix).toBe('bar');
    expect(attrs.definition.left_label).toBe('low');
    expect(attrs.definition.right_label).toBe('high');
  });
});
