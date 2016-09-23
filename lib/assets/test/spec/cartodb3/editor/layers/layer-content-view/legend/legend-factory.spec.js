// var _ = require('underscore');
var Backbone = require('backbone');
var LegendDefinitionsCollection = require('../../../../../../../javascripts/cartodb3/data/legends/legend-definitions-collection');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var LegendFactory = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/legend-factory');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');

describe('editor/layers/layer-content-view/legend/legend-factory', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      fetched: true,
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocss: 'asd',
        source: 'a0'
      }
    }, {
      parse: true,
      configModel: this.configModel
    });

    this.layerDefinitionsCollection = new Backbone.Collection();
    this.layerDefinitionsCollection.add(this.layerDefinitionModel);

    this.legendDefinitionsCollection = new LegendDefinitionsCollection([], {
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      configModel: this.configModel,
      vizId: 'v-123'
    });

    LegendFactory.init(this.legendDefinitionsCollection);
  });

  it('create legend', function () {
    LegendFactory.createLegend(this.layerDefinitionModel, 'bubble');
    LegendFactory.createLegend(this.layerDefinitionModel, 'choropleth');
    LegendFactory.createLegend(this.layerDefinitionModel, 'category');

    expect(this.legendDefinitionsCollection.length).toBe(3);
    expect(this.legendDefinitionsCollection.at(0).get('type')).toBe('bubble');
    expect(this.legendDefinitionsCollection.at(1).get('type')).toBe('choropleth');
    expect(this.legendDefinitionsCollection.at(2).get('type')).toBe('category');
  });

  it('remove legend', function () {
    LegendFactory.createLegend(this.layerDefinitionModel, 'bubble');
    LegendFactory.createLegend(this.layerDefinitionModel, 'choropleth');
    LegendFactory.createLegend(this.layerDefinitionModel, 'category');

    LegendFactory.removeLegend(this.layerDefinitionModel, 'bubble');

    expect(this.legendDefinitionsCollection.length).toBe(2);
    expect(this.legendDefinitionsCollection.at(0).get('type')).toBe('choropleth');
    expect(this.legendDefinitionsCollection.at(1).get('type')).toBe('category');
  });

  it('remove all legends', function () {
    LegendFactory.createLegend(this.layerDefinitionModel, 'bubble');
    LegendFactory.createLegend(this.layerDefinitionModel, 'choropleth');
    LegendFactory.createLegend(this.layerDefinitionModel, 'category');

    LegendFactory.removeAllLegend(this.layerDefinitionModel);
    expect(this.legendDefinitionsCollection.length).toBe(0);
  });
});
