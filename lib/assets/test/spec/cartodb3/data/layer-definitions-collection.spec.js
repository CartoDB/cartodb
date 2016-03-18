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
    // layer example data
    var d = function (customOpts) {
      var opts = customOpts || {};
      opts.type = opts || 'CartoDB';
      return {
        options: opts
      };
    };

    // Adds A-D, like if the collection was creatd from scratch
    var layersData = [
      d(),
      d({letter: 'b'}),
      d(),
      d({letter: 'a'})
    ];
    this.collection.resetByLayersData(layersData);
    expect(this.collection.pluck('letter')).toEqual(['c', 'b', 'd', 'a']);

    // Remove C
    this.collection.remove(this.collection.at(0));
    expect(this.collection.pluck('letter')).toEqual(['b', 'd', 'a']);

    // Add new as C
    this.collection.add(d());
    expect(this.collection.pluck('letter')).toEqual(['b', 'd', 'a', 'c']);

    // Add new as E, F, G
    this.collection.add([d(), d(), d()]);
    expect(this.collection.pluck('letter')).toEqual(['b', 'd', 'a', 'c', 'e', 'f', 'g']);

    // Remove all existing and add a new
    this.collection.reset([d(), d()]);
    expect(this.collection.pluck('letter')).toEqual(['a', 'b']);
  });

  describe('when there are some layers', function () {
    beforeEach(function () {
      this.collection.reset([{
        id: 'l-0',
        order: 0,
        options: {
          type: 'Tiled',
          name: 'Basemap'
        }
      }, {
        id: 'l-1',
        order: 1,
        options: {
          type: 'CartoDB',
          table_name: 'foobar'
        }
      }, {
        id: 'l-2',
        order: 2,
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
          type: 'Plain',
          color: 'blue'
        }
      });
      this.layerDefinitionModel = this.collection.get('integration-test');
    });

    it('should have created the layer', function () {
      var l = this.vis.map.layers.get(this.layerDefinitionModel.id);
      expect(l).toBeDefined();
      expect(l.get('color')).toEqual('blue');
      expect(l.get('type')).toEqual('Plain');
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
          cartocss: 'asd',
          sql: 'SELECT * FROM my_table'
        });
        this.layerAfter = this.vis.map.layers.get(this.layerDefinitionModel.id);
      });

      it('should have re-created layer', function () {
        expect(this.layerAfter).not.toBe(this.layerBefore);
        expect(this.layerAfter.get('sql')).toEqual('SELECT * FROM my_table');
        expect(this.layerAfter.get('type')).toEqual('CartoDB');
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
