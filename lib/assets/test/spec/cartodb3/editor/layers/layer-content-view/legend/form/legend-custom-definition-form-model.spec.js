var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('../../../../../../../../javascripts/cartodb3/data/config-model');
var LegendCustomDefinitionModel = require('../../../../../../../../javascripts/cartodb3/data/legends/legend-custom-definition-model');
var LegendCustomFormDefinitionModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/form/legend-custom-definition-form-model');

describe('editor/layers/layer-content-views/legends/form/legend-custom-definition-model', function () {
  var legendDefinitionModel;
  var legendFormModel;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    legendDefinitionModel = new LegendCustomDefinitionModel({
      title: 'Foo',
      items: [{
        title: 'foo',
        color: '#fabada'
      }, {
        title: 'bar',
        color: '#abadaf'
      }, {
        title: 'baz',
        color: '#ababab'
      }]
    }, {
      layerDefinitionModel: new Backbone.Model(),
      configModel: configModel,
      vizId: 1
    });

    legendFormModel = new LegendCustomFormDefinitionModel(
      _.pick(legendDefinitionModel.attributes, 'title', 'items'), {
        legendDefinitionModel: legendDefinitionModel
      }
    );
  });

  it('should initialize items correctly', function () {
    var items = legendFormModel.get('items');
    expect(items.length).toBe(3);
    expect(items[0].fill.color.fixed).toBe('#fabada');
    expect(items[1].fill.color.fixed).toBe('#abadaf');
    expect(items[2].fill.color.fixed).toBe('#ababab');
  });

  it('should parse items correctly', function () {
    var items = legendFormModel.toJSON().items;
    expect(items.length).toBe(3);
    expect(items[0].color).toBe('#fabada');
    expect(items[1].color).toBe('#abadaf');
    expect(items[2].color).toBe('#ababab');
  });
});
