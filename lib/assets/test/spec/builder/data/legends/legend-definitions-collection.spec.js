var Backbone = require('backbone');
var LegendDefinitionCollection = require('builder/data/legends/legend-definitions-collection');
var ConfigModel = require('builder/data/config-model');

describe('data/legends/legend-definitions-collection', function () {
  var legendDefCollection;
  var layerDefCollection;
  var vizJSON;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var styleModel = new Backbone.Model({
      fill: {
        size: {
          attribute: 'n_anclajes',
          range: [5, 20]
        },
        color: {
          bins: 3,
          range: ['#ffeda0', '#feb24c', '#f03b20'],
          attribute: 'n_anclajes'
        }
      }
    });

    var layerDef1 = new Backbone.Model({
      id: 'fa6cf872-fffa-4301-9a60-849cedba7864',
      table_name: 'foo'
    });
    layerDef1.styleModel = styleModel;

    var layerDef2 = new Backbone.Model({
      id: 'fa6cf872-fffa-4301-9a60-849cedba7865',
      table_name: 'bar'
    });
    layerDef2.styleModel = styleModel;

    layerDefCollection = new Backbone.Collection([]);
    layerDefCollection.add(layerDef1);
    layerDefCollection.add(layerDef2);

    vizJSON = {
      layers: [
        {
          id: 'fa6cf872-fffa-4301-9a60-849cedba7864',
          type: 'CartoDB',
          legends: [
            {
              type: 'bubble',
              title: 'My Bubble Legend',
              fill_color: '#FABADA'
            },
            {
              type: 'category',
              title: 'My Category Legend',
              prefix: 'prefix',
              sufix: 'sufix'
            },
            {
              type: 'choropleth',
              title: 'My Choropleth Legend',
              prefix: 'prefix',
              sufix: 'sufix'
            },
            {
              type: 'custom',
              title: 'My Custom Legend',
              items: [
                { name: 'Category 1', type: 'color', color: '#CACACA' },
                { name: 'Category 2', type: 'color', color: '#FABADA' }
              ]
            }
          ]
        },
        {
          id: 'fa6cf872-fffa-4301-9a60-849cedba7865',
          type: 'CartoDB',
          legends: [
            {
              type: 'bubble',
              title: 'My Bubble Legend',
              fill_color: '#FABADA'
            },
            {
              type: 'category',
              title: 'My Category Legend',
              prefix: 'prefix',
              sufix: 'sufix'
            }
          ]
        }
      ]
    };

    legendDefCollection = new LegendDefinitionCollection([], {
      configModel: configModel,
      layerDefinitionsCollection: layerDefCollection,
      vizId: 'v-123'
    });

    legendDefCollection.resetByData(vizJSON);
  });

  it('should be populated properly', function () {
    expect(legendDefCollection.length).toBe(6);
    expect(legendDefCollection.at(0).get('type')).toBe('bubble');
    expect(legendDefCollection.at(0).layerDefinitionModel.get('id')).toBe('fa6cf872-fffa-4301-9a60-849cedba7864');
    expect(legendDefCollection.at(2).get('type')).toBe('choropleth');
    expect(legendDefCollection.at(2).layerDefinitionModel.get('id')).toBe('fa6cf872-fffa-4301-9a60-849cedba7864');
    expect(legendDefCollection.at(5).get('type')).toBe('category');
    expect(legendDefCollection.at(5).layerDefinitionModel.get('id')).toBe('fa6cf872-fffa-4301-9a60-849cedba7865');
  });

  it('should search by layerDefModel properly', function () {
    var layerDefModel = layerDefCollection.at(0);
    var legends = legendDefCollection.findByLayerDefModel(layerDefModel);
    expect(legends.length).toBe(4);
    expect(legends[0].get('type')).toBe('bubble');
    expect(legends[1].get('type')).toBe('category');
    expect(legends[2].get('type')).toBe('choropleth');
  });

  it('should search by type properly', function () {
    var layerDefModel = layerDefCollection.at(0);
    var legend = legendDefCollection.findByLayerDefModelAndType(layerDefModel, 'choropleth');
    expect(legend.layerDefinitionModel).toBe(layerDefModel);
    expect(legend.get('title')).toBe('My Choropleth Legend');
  });

  it('should search by types properly', function () {
    var layerDefModel = layerDefCollection.at(1);
    var legends = legendDefCollection.findByLayerDefModelAndTypes(layerDefModel, ['category', 'choropleth', 'custom']);
    expect(legends.length).toBe(1);
    expect(legends[0].get('type')).toBe('category');
    expect(legends[0].layerDefinitionModel).toBe(layerDefModel);
  });
});
