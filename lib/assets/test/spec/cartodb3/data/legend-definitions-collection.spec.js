var Backbone = require('backbone');
var LegendDefinitionCollection = require('../../../../javascripts/cartodb3/data/legend-definitions-collection');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');

describe('data/legend-definitions-collection', function () {
  var legendDefCollection;
  var vizJSON;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var layerDefinitionsCollection = new Backbone.Collection([{
      id: 'fa6cf872-fffa-4301-9a60-849cedba7864',
      table_name: 'foo'
    }, {
      id: 'fa6cf872-fffa-4301-9a60-849cedba7865',
      table_name: 'bar'
    }]);

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
              title: 'My Category Legend',
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
            },
            {
              type: 'html',
              title: 'My HTML Legend',
              html: '<p>Some HTML that will get sanitised</p>'
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
      layerDefinitionsCollection: layerDefinitionsCollection
    });

    legendDefCollection.resetByLayersData(vizJSON);
  });

  it('should be populated properly', function () {
    expect(legendDefCollection.length).toBe(7);
    expect(legendDefCollection.at(0).get('type')).toBe('bubble');
    expect(legendDefCollection.at(0).layerDefinitionModel.get('id')).toBe('fa6cf872-fffa-4301-9a60-849cedba7864');
    expect(legendDefCollection.at(2).get('type')).toBe('choropleth');
    expect(legendDefCollection.at(2).layerDefinitionModel.get('id')).toBe('fa6cf872-fffa-4301-9a60-849cedba7864');
    expect(legendDefCollection.at(6).get('type')).toBe('category');
    expect(legendDefCollection.at(6).layerDefinitionModel.get('id')).toBe('fa6cf872-fffa-4301-9a60-849cedba7865');
  });
});
