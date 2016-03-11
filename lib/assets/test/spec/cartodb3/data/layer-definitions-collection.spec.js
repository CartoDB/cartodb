var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('../../../../javascripts/cartodb3/data/layer-definitions-collection');

describe('data/layer-definitions-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection();

    this.collection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      layersCollection: new Backbone.Collection(),
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123'
    });
  });

  it('should create the layer with the next letter representation available', function () {
    // Adds A-D, like if the collection was creatd from scratch
    this.collection.reset([{}, {}, {}, {}], { silent: true });
    expect(this.collection.first().get('letter')).toEqual('a');
    expect(this.collection.at(2).get('letter')).toEqual('c');
    expect(this.collection.last().get('letter')).toEqual('d');

    // Remove C
    this.collection.remove(this.collection.at(2));

    // Add new as C
    this.collection.add({});
    expect(this.collection.last().get('letter')).toEqual('c');

    // Add new as E
    this.collection.add({});
    expect(this.collection.last().get('letter')).toEqual('e');
  });

  describe('when there are some layers', function () {
    beforeEach(function () {
      this.collection.reset([{
        id: 'l-0',
        options: {
          type: 'Tiled',
          name: 'Basemap'
        }
      }, {
        id: 'l-1',
        options: {
          type: 'CartoDB',
          table_name: 'foobar'
        }
      }, {
        id: 'l-2',
        options: {
          type: 'CartoDB',
          table_name: 'foobar',
          query: 'SELECT * FROM foobar limit 10'
        }
      }]);
      this.l0 = this.collection.get('l-0');
      this.l1 = this.collection.get('l-1');
      this.l2 = this.collection.get('l-2');
    });

    it('should have created analysis nodes for the data layers', function () {
      expect(this.analysisDefinitionNodesCollection.get('trololol')).toBeUndefined();

      expect(this.l1.get('source')).toEqual('a0');
      expect(this.analysisDefinitionNodesCollection.get('a0')).toBeDefined();

      expect(this.l2.get('source')).toEqual('b0');
      expect(this.analysisDefinitionNodesCollection.get('b0')).toBeDefined();
    });
  });
});
