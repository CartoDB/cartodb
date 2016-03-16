var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('../../../../javascripts/cartodb3/data/layer-definitions-collection');
var createDefaultVis = require('../create-default-vis');

describe('data/layer-definitions-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection();

    this.vis = createDefaultVis();

    this.collection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      vis: this.vis,
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
    this.collection.add({
      options: {
        type: 'Plain',
        color: 'black'
      }
    });
    expect(this.collection.last().get('letter')).toEqual('c');

    // Add new as E
    this.collection.add({
      options: {
        type: 'Plain',
        color: 'black'
      }
    });
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

  describe('when a layer is created', function () {
    beforeEach(function () {
      this.collection.add({
        id: 'integration-test',
        options: {
          type: 'plain',
          color: 'blue'
        }
      });
      this.layerDefinitionModel = this.collection.get('integration-test');
    });

    it('should have created the layer', function () {
      var l = this.vis.map.layers.get(this.layerDefinitionModel.id);
      expect(l).toBeDefined();
      expect(l.get('color')).toEqual('blue');
    });

    describe('when update some layer attrs', function () {
      beforeEach(function () {
        this.layerDefinitionModel.set({
          color: 'pink',
          letter: 'c'
        });
      });

      it('should update the equivalent layer', function () {
        var l = this.vis.map.layers.get(this.layerDefinitionModel.id);
        expect(l.get('color')).toEqual('pink');
      });
    });

    describe('when update layer includes change of type', function () {
      beforeEach(function () {
        this.layerBefore = this.vis.map.layers.get(this.layerDefinitionModel.id);
        this.layerDefinitionModel.set({
          type: 'CartoDB',
          table_name: 'my_table',
          cartocss: '',
          sql: 'SELECT * FROM my_table'
        });
        this.layerAfter = this.vis.map.layers.get(this.layerDefinitionModel.id);
      });

      it('should have re-created layer', function () {
        expect(this.layerAfter.get('sql')).toEqual('SELECT * FROM my_table');
        expect(this.layerAfter).not.toBe(this.layerBefore);
      });
    });

    describe('when removing layer', function () {
      beforeEach(function () {
        this.layerDefinitionModel.destroy();
      });

      it('should no longer be accessible', function () {
        expect(this.vis.map.layers.get(this.layerDefinitionModel.id)).toBeUndefined();
      });
    });
  });
});
