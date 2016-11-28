var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');
var LayerDefinitionsCollection = require('../../../../javascripts/cartodb3/data/layer-definitions-collection');
var layerColors = require('../../../../javascripts/cartodb3/data/layer-colors');

describe('data/layer-definitions-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      user_name: 'pepe',
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });

    this.collection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123',
      stateDefinitionModel: {}
    });
  });

  describe('.add', function () {
    it('should not have created source nodes for layers that have non-sources', function () {
      this.collection.add({
        id: 'A',
        kind: 'carto',
        options: {
          table_name: 'alice',
          source: 'a1'
        }
      });
      expect(this.analysisDefinitionNodesCollection.pluck('id')).not.toContain('a0');
    });

    it('should create source if it matches expected source node id', function () {
      this.collection.add({
        id: 'A',
        kind: 'carto',
        options: {
          table_name: 'alice',
          source: 'a0'
        }
      });
      expect(this.analysisDefinitionNodesCollection.pluck('id')).toContain('a0');
    });
  });

  it('should create the layer with the next letter representation available but only for data layers', function () {
    // Adds A-D, like if the collection was created from scratch
    var layersData = [
      {kind: 'tiled', order: 0}, // a basemap
      {kind: 'carto', order: 1, options: {letter: 'b'}},
      {kind: 'carto', order: 2},
      {kind: 'carto', order: 3, options: {letter: 'a'}},
      {kind: 'torque', order: 4}
    ];
    this.collection.resetByLayersData(layersData);
    expect(this.collection.pluck('letter')).toEqual([undefined, 'b', 'c', 'a', 'd']);

    // Remove C
    this.collection.remove(this.collection.findWhere({letter: 'c'}));
    expect(this.collection.pluck('letter')).toEqual([undefined, 'b', 'a', 'd']);

    // Add new as C
    this.collection.add({kind: 'carto', order: 4});
    expect(this.collection.pluck('letter')).toEqual([undefined, 'b', 'a', 'd', 'c']);

    // Add new as E, F, G
    this.collection.add([
      {kind: 'carto', order: 5},
      {kind: 'carto', order: 6},
      {kind: 'carto', order: 7}
    ]);
    expect(this.collection.pluck('letter')).toEqual([undefined, 'b', 'a', 'd', 'c', 'e', 'f', 'g']);

    // Add a new tiled (labels-on-top) layer
    this.collection.add({kind: 'tiled', order: 8});
    expect(this.collection.pluck('letter')).toEqual([undefined, 'b', 'a', 'd', 'c', 'e', 'f', 'g', undefined]);

    // Remove all existing and add a new, should reset letters
    this.collection.reset([
      {kind: 'tiled'},
      {kind: 'carto'}
    ]);
    expect(this.collection.pluck('letter')).toEqual([undefined, 'a']);
  });

  it('should create the layer with the color that corresponds to the letter', function () {
    var layersData = [
      { kind: 'tiled', order: 0 }, // a basemap
      { kind: 'carto', order: 1 },
      { kind: 'carto', order: 2 },
      { kind: 'torque', order: 3 }
    ];

    this.collection.resetByLayersData(layersData);
    expect(this.collection.pluck('letter')).toEqual([ undefined, 'a', 'b', 'c' ]);
    expect(this.collection.pluck('color')).toEqual([ undefined, layerColors.COLORS[0], layerColors.COLORS[1], layerColors.COLORS[2] ]);

    this.collection.remove(this.collection.at(0));
    expect(this.collection.pluck('letter')).toEqual([ 'a', 'b', 'c' ]);
    expect(this.collection.pluck('color')).toEqual([ layerColors.COLORS[0], layerColors.COLORS[1], layerColors.COLORS[2] ]);

    this.collection.add({ kind: 'carto' });
    expect(this.collection.pluck('letter')).toEqual([ 'a', 'b', 'c', 'd' ]);
    expect(this.collection.pluck('color')).toEqual([ layerColors.COLORS[0], layerColors.COLORS[1], layerColors.COLORS[2], layerColors.COLORS[3] ]);

    // Remove all existing and add a couple of new layers
    this.collection.reset([
      { kind: 'carto' },
      { kind: 'carto' }
    ]);
    expect(this.collection.pluck('letter')).toEqual([ 'a', 'b' ]);
    expect(this.collection.pluck('color')).toEqual([layerColors.COLORS[0], layerColors.COLORS[1]]);
  });

  it('should create a layer with the owner of the table in the query', function () {
    var layer1 = this.collection.add({
      kind: 'carto',
      options: {
        table_name: 'table_name',
        user_name: 'paco'
      }
    });

    var sourceNode1 = this.analysisDefinitionNodesCollection.get(layer1.get('source'));
    expect(layer1.get('sql').toLowerCase()).toBe('select * from paco.table_name');
    expect(sourceNode1.get('query').toLowerCase()).toBe('select * from paco.table_name');

    var layer2 = this.collection.add({
      kind: 'carto',
      options: {
        table_name: '000cd294-b124-4f82-b569-0f7fe41d2db8',
        user_name: 'paco'
      }
    });

    var sourceNode2 = this.analysisDefinitionNodesCollection.get(layer2.get('source'));
    expect(layer2.get('sql').toLowerCase()).toBe('select * from paco."000cd294-b124-4f82-b569-0f7fe41d2db8"');
    expect(sourceNode2.get('query').toLowerCase()).toBe('select * from paco."000cd294-b124-4f82-b569-0f7fe41d2db8"');

    var layer3 = this.collection.add({
      kind: 'carto',
      options: {
        table_name: 'table_name',
        user_name: 'pepe'
      }
    });

    var sourceNode3 = this.analysisDefinitionNodesCollection.get(layer3.get('source'));
    expect(layer3.get('sql').toLowerCase()).toBe('select * from table_name');
    expect(sourceNode3.get('query').toLowerCase()).toBe('select * from table_name');

    var layer4 = this.collection.add({
      kind: 'carto',
      options: {
        table_name: 'paco.table_name',
        user_name: ''
      }
    });

    var sourceNode4 = this.analysisDefinitionNodesCollection.get(layer4.get('source'));
    expect(layer4.get('sql').toLowerCase()).toBe('select * from paco.table_name');
    expect(sourceNode4.get('query').toLowerCase()).toBe('select * from paco.table_name');
  });

  describe('when there are some layers', function () {
    beforeEach(function () {
      this.collection.reset([{
        id: 'l-0',
        order: 0,
        kind: 'tiled',
        options: {
          name: 'Basemap'
        }
      }, {
        id: 'l-1',
        order: 1,
        kind: 'carto',
        options: {
          letter: 'a',
          table_name: 'foobar'
        }
      }, {
        id: 'l-2',
        order: 2,
        kind: 'carto',
        options: {
          letter: 'b',
          source: 'b0',
          table_name: 'foobar',
          query: 'SELECT * FROM foobar limit 10'
        }
      }]);
      this.l0 = this.collection.get('l-0');
      this.l1 = this.collection.get('l-1');
      this.l2 = this.collection.get('l-2');
    });

    it('should have created analysis nodes for the data layers', function () {
      expect(this.l1.get('source')).toEqual('a0');
      expect(this.l2.get('source')).toEqual('b0');
      expect(this.analysisDefinitionNodesCollection.pluck('id')).toEqual(['a0', 'b0']);
    });
  });

  describe('.save', function () {
    beforeEach(function () {
      spyOn(Backbone, 'sync');

      this.layer1 = new Backbone.Model({ id: 'layer1', type: 'Tiled' });
      this.layer2 = new Backbone.Model({ id: 'layer2', type: 'CartoDB' });
      this.layer3 = new Backbone.Model({ id: 'layer3', type: 'CartoDB' });

      this.collection.reset([
        this.layer3,
        this.layer1,
        this.layer2
      ]);
    });

    it('should order and save the entire collection when all analysis definitions have been created', function () {
      var options = {};
      this.collection.save(options);
      expect(this.collection.pluck('id')).toEqual(['layer3', 'layer1', 'layer2']);
      expect(Backbone.sync).toHaveBeenCalledWith('update', this.collection, options);
    });
  });

  describe('.getNumberOfDataLayers', function () {
    it('should return the number of CartoDB and Torque layers', function () {
      expect(this.collection.getNumberOfDataLayers()).toEqual(0);

      this.collection.reset([
        { kind: 'tiled' },
        { kind: 'carto' },
        { kind: 'torque' },
        { kind: 'background' }
      ]);

      expect(this.collection.getNumberOfDataLayers()).toEqual(2);
    });
  });

  describe('.findPrimaryParentLayerToAnalysisNode', function () {
    beforeEach(function () {
      this.b1 = this.analysisDefinitionNodesCollection.add({
        id: 'b1',
        type: 'buffer',
        params: {
          radius: 3,
          source: {
            id: 'a2',
            type: 'buffer',
            params: {
              radius: 2,
              source: {
                id: 'a1',
                type: 'buffer',
                params: {
                  radius: 1,
                  source: {
                    id: 'a0',
                    type: 'source',
                    params: {
                      query: 'SELECT * FROM foobar'
                    }
                  }
                }
              }
            }
          }
        }
      });

      this.collection.add([
        {
          id: 'A',
          kind: 'carto',
          options: {
            source: 'a2'
          }
        }, {
          id: 'B',
          kind: 'carto',
          options: {
            source: 'b1'
          }
        }
      ]);
    });

    it('should return a parent layer if given node is a direct node below a node in another layer', function () {
      var a2 = this.analysisDefinitionNodesCollection.get('a2');
      expect(this.collection.findPrimaryParentLayerToAnalysisNode(a2).id).toEqual('B');
    });

    it('should not return anything if found layer should be excluded', function () {
      var a2 = this.analysisDefinitionNodesCollection.get('a2');
      var opts = {exclude: this.collection.get('B')};
      expect(this.collection.findPrimaryParentLayerToAnalysisNode(a2, opts)).toBeUndefined();

      opts = {exclude: [this.collection.get('B')]};
      expect(this.collection.findPrimaryParentLayerToAnalysisNode(a2, opts)).toBeUndefined();
    });

    it('should not return anything if given node has no parent layer immediate above it', function () {
      var a1 = this.analysisDefinitionNodesCollection.get('a1');
      expect(this.collection.findPrimaryParentLayerToAnalysisNode(a1)).toBeUndefined();
      var b1 = this.analysisDefinitionNodesCollection.get('b1');
      expect(this.collection.findPrimaryParentLayerToAnalysisNode(b1)).toBeUndefined();
    });
  });

  describe('layers position methods', function () {
    beforeEach(function () {
      this.collection.reset([
        { kind: 'tiled' },
        { kind: 'carto' },
        { kind: 'carto' },
        { kind: 'torque' },
        { kind: 'tiled' }
      ]);
    });

    it('.isDataLayerOnTop', function () {
      expect(this.collection.isDataLayerOnTop(this.collection.at(1))).toBeFalsy();
      expect(this.collection.isDataLayerOnTop(this.collection.at(2))).toBeFalsy();
      expect(this.collection.isDataLayerOnTop(this.collection.at(3))).toBeTruthy();

      // Removing "labels on top" layer
      this.collection.remove(this.collection.last());

      expect(this.collection.isDataLayerOnTop(this.collection.at(1))).toBeFalsy();
      expect(this.collection.isDataLayerOnTop(this.collection.at(2))).toBeFalsy();
      expect(this.collection.isDataLayerOnTop(this.collection.at(3))).toBeTruthy();

      // Removing torque layer
      this.collection.remove(this.collection.last());

      expect(this.collection.isDataLayerOnTop(this.collection.at(1))).toBeFalsy();
      expect(this.collection.isDataLayerOnTop(this.collection.at(2))).toBeTruthy();
    });

    it('.getTopDataLayerIndex', function () {
      expect(this.collection.getTopDataLayerIndex()).toBe(3);

      // Removing "labels on top" layer
      this.collection.remove(this.collection.last());

      expect(this.collection.getTopDataLayerIndex()).toBe(3);
      // Removing torque layer
      this.collection.remove(this.collection.last());

      expect(this.collection.getTopDataLayerIndex()).toBe(2);
    });
  });
});
