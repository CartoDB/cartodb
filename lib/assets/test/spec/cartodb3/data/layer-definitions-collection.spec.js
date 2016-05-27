var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var LayerDefinitionsCollection = require('../../../../javascripts/cartodb3/data/layer-definitions-collection');

describe('data/layer-definitions-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
    });
    this.analysisDefinitionsCollection = new AnalysisDefinitionsCollection(null, {
      configModel: configModel,
      vizId: 'viz123',
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection
    });

    this.collection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      analysisDefinitionsCollection: this.analysisDefinitionsCollection,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123'
    });
  });

  describe('.createLayerForTable', function () {
    it('should invoke the success callback if layer is correctly created', function () {
      spyOn(this.collection, 'create');
      var successCallback = jasmine.createSpy('successCallback');

      this.collection.createLayerForTable('tableName', { success: successCallback });

      this.collection.create.calls.argsFor(0)[1].success();

      expect(successCallback).toHaveBeenCalled();
    });

    it('should invoke the error callback if layer creation fails', function () {
      spyOn(this.collection, 'create');
      var errorCallback = jasmine.createSpy('errorCallback');

      this.collection.createLayerForTable('tableName', { error: errorCallback });

      this.collection.create.calls.argsFor(0)[1].error();

      expect(errorCallback).toHaveBeenCalled();
    });

    it("should save the layer that is on top if it's a Tiled layer", function () {
      var TiledLayer = new Backbone.Model({
        type: 'Tiled',
        order: 1
      });
      var CartoDBLayer = new Backbone.Model({
        type: 'CartoDB',
        order: 0
      });
      this.collection.reset([
        TiledLayer,
        CartoDBLayer
      ]);

      spyOn(TiledLayer, 'save');
      spyOn(this.collection, 'create');

      this.collection.createLayerForTable('tableName');

      this.collection.create.calls.argsFor(0)[1].success();

      expect(TiledLayer.save).toHaveBeenCalled();
    });

    it('should place the new layer above the "CartoDB" layer on top', function () {
      var CartoDBLayer_1 = new Backbone.Model({
        type: 'CartoDB',
        order: 1
      });
      var CartoDBLayer_0 = new Backbone.Model({
        type: 'CartoDB',
        order: 0
      });
      this.collection.reset([
        CartoDBLayer_1,
        CartoDBLayer_0
      ]);

      var newLayer = this.collection.createLayerForTable('tableName');

      // Order of new layer
      expect(newLayer.get('order')).toEqual(2);

      // Order of other layers has not been changed
      expect(CartoDBLayer_1.get('order')).toEqual(1);
      expect(CartoDBLayer_0.get('order')).toEqual(0);
    });

    it('should place the new layer below the "Tiled" layer on top (labels) and update the top most layer', function () {
      var TiledLayer_1 = new Backbone.Model({
        type: 'Tiled',
        order: 1
      });
      spyOn(TiledLayer_1, 'save');
      var CartoDBLayer_0 = new Backbone.Model({
        type: 'CartoDB',
        order: 0
      });
      this.collection.reset([
        TiledLayer_1,
        CartoDBLayer_0
      ]);

      var newLayer = this.collection.createLayerForTable('tableName');

      // Order of new layer
      expect(newLayer.get('order')).toEqual(1);

      // Order of other layers has not been changed
      expect(TiledLayer_1.get('order')).toEqual(2);
      expect(CartoDBLayer_0.get('order')).toEqual(0);
    });
  });

  describe('.createNewAnalysisNode', function () {
    beforeEach(function () {
      this.layerDefModel = this.collection.add({
        id: 'l-100',
        order: 1,
        kind: 'carto',
        options: {
          table_name: 'foobar',
          cartocss: 'before'
        }
      });
      spyOn(this.layerDefModel, 'save').and.callThrough();
      spyOn(this.layerDefModel, 'sync');
      this.nodeAttrs = {
        id: 'a1',
        type: 'trade-area',
        source: 'a0',
        kind: 'walk',
        time: 123
      };
      this.res = this.collection.createNewAnalysisNode(this.nodeAttrs);
    });

    it('should create a new analysis ', function () {
      expect(this.res).toBeDefined();
    });

    it('should return the node collection', function () {
      expect(this.collection.getAnalysisDefinitionNodesCollection()).toEqual(this.analysisDefinitionNodesCollection);
    });

    it('should create a definition for the node', function () {
      expect(this.analysisDefinitionsCollection.findByNodeId('a1')).toBeDefined();
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

    describe('when a layer is destroyed', function () {
      it('should not do anything if the layer does not have any analysis', function () {
        this.l0.destroy();
        expect(this.analysisDefinitionNodesCollection.pluck('id')).toEqual(['a0', 'b0']);
      });

      it('should remove the analysis nodes owned by the own layer', function () {
        this.l1.destroy();
        expect(this.analysisDefinitionNodesCollection.pluck('id')).toEqual(['b0']);

        this.l2.destroy();
        expect(this.analysisDefinitionNodesCollection.pluck('id')).toEqual([]);
      });
    });
  });

  describe('when analysis node is removed', function () {
    beforeEach(function () {
      this.analysisDefinitionsCollection.add([
        {
          id: '1st',
          analysis_definition: {
            id: 'a2',
            type: 'buffer',
            params: {
              source: {
                id: 'a1',
                type: 'buffer',
                params: {
                  source: {
                    id: 'a0',
                    type: 'source',
                    params: {
                      query: 'SELECT * FROM something'
                    }
                  }
                }
              }
            }
          }
        }, {
          id: '2nd',
          analysis_definition: {
            id: 'c1',
            type: 'buffer',
            params: {
              source: {
                id: 'b0',
                type: 'source',
                params: {
                  query: 'SELECT * FROM something_else'
                }
              }
            }
          }
        }
      ]);
      this.collection.add([
        {
          id: 'lA',
          kind: 'carto',
          options: {
            letter: 'a',
            source: 'a2'
          }
        }, {
          id: 'lB',
          kind: 'carto',
          options: {
            letter: 'b',
            source: 'b0'
          }
        }, {
          id: 'lC',
          kind: 'carto',
          options: {
            letter: 'c',
            source: 'c1'
          }
        }
      ]);
      this.analysisDefinitionNodesCollection.add([{
        id: 'x1',
        type: 'buffer',
        params: {
          source: {
            id: 'x0',
            type: 'source',
            params: {
              query: 'SELECT * FROM orphans'
            }
          }
        }
      }]);
    });

    describe('when a node that has a source is removed', function () {
      beforeEach(function () {
        spyOn(this.collection.get('lA'), 'save').and.callThrough();

        this.analysisDefinitionNodesCollection.get('a1').destroy();
      });

      it('should update owning layer to point to the source of the deleted node', function () {
        expect(this.collection.get('lA').get('source')).toEqual('a0');
      });

      it('should only modify the layer once', function () {
        expect(this.collection.get('lA').save).toHaveBeenCalled();
        expect(this.collection.get('lA').save.calls.count()).toEqual(1);
      });

      it('should delete dependent nodes', function () {
        expect(this.analysisDefinitionNodesCollection.get('a2')).toBeUndefined();
      });

      it('should delete orphaned nodes', function () {
        expect(this.analysisDefinitionNodesCollection.pluck('id')).toEqual(['a0', 'b0', 'c1']);
      });
    });

    describe('when a node that is a source is removed', function () {
      beforeEach(function () {
        this.lB = this.collection.get('lB');
        this.lC = this.collection.get('lC');
        spyOn(this.lB, 'destroy').and.callThrough();
        spyOn(this.lC, 'destroy').and.callThrough();

        this.analysisDefinitionNodesCollection.get('b0').destroy();
      });

      it('should delete the owning layer and the other layer that depended on the removed node', function () {
        expect(this.collection.pluck('id')).toEqual(['lA']);
        expect(this.lB.destroy).toHaveBeenCalled();
        expect(this.lC.destroy).toHaveBeenCalled();
      });

      it('should delete orphaned nodes', function () {
        expect(this.analysisDefinitionNodesCollection.pluck('id')).toEqual(['a0', 'a1', 'a2']);
      });
    });
  });

  describe('.save', function () {
    beforeEach(function () {
      spyOn(Backbone, 'sync');
      this.promises = [];
      spyOn(this.analysisDefinitionsCollection, 'create').and.callFake(function () {
        var promise = $.Deferred();
        this.promises.push(promise);
        return promise;
      }.bind(this));

      this.layer1 = new Backbone.Model({ id: 'layer1', order: 0, type: 'Tiled' });
      this.layer2 = new Backbone.Model({ id: 'layer2', order: 1, type: 'CartoDB' });
      this.layer3 = new Backbone.Model({ id: 'layer3', order: 2, type: 'CartoDB' });

      this.layer1.getAnalysisDefinitionNodeModel = jasmine.createSpy('getAnalysisDefinitionNodeModel').and.returnValue(undefined);
      this.layer2.getAnalysisDefinitionNodeModel = jasmine.createSpy('getAnalysisDefinitionNodeModel').and.returnValue({ toJSON: function () { return 'analysis1'; } });
      this.layer3.getAnalysisDefinitionNodeModel = jasmine.createSpy('getAnalysisDefinitionNodeModel').and.returnValue({ toJSON: function () { return 'analysis2'; } });

      this.collection.reset([
        this.layer1,
        this.layer2,
        this.layer3
      ]);
    });

    it('should create analysisDefinitions', function () {
      this.collection.save();

      expect(this.analysisDefinitionsCollection.create.calls.count()).toEqual(2);
      expect(this.analysisDefinitionsCollection.create.calls.argsFor(0)).toEqual([{ analysis_definition: 'analysis1' }]);
      expect(this.analysisDefinitionsCollection.create.calls.argsFor(1)).toEqual([{ analysis_definition: 'analysis2' }]);
    });

    it('should save the entire collection when all analysis definitions have been created', function () {
      var options = {};
      this.collection.save(options);

      expect(Backbone.sync).not.toHaveBeenCalled();

      _.each(this.promises, function (promise) {
        promise.resolve();
      });

      expect(Backbone.sync).toHaveBeenCalledWith('update', this.collection, options);
    });
  });

  describe('.moveLayer', function () {
    beforeEach(function () {
      this.layer1 = new Backbone.Model({ id: 'layer1', order: 0, type: 'Tiled' });
      this.layer2 = new Backbone.Model({ id: 'layer2', order: 1, type: 'CartoDB' });
      this.layer3 = new Backbone.Model({ id: 'layer3', order: 2, type: 'CartoDB' });
      this.layer4 = new Backbone.Model({ id: 'layer4', order: 3, type: 'CartoDB' });
      this.layer5 = new Backbone.Model({ id: 'layer5', order: 4, type: 'CartoDB' });

      this.collection.reset([
        this.layer1,
        this.layer2,
        this.layer3,
        this.layer4,
        this.layer5
      ]);
      this.collection.sort();

      spyOn(this.collection, 'save').and.callFake(function () {});
    });

    it('should reset orders when moving a layer up', function () {
      this.collection.moveLayer({ from: 1, to: 3 });

      expect(this.collection.pluck('id')).toEqual([
        'layer1',
        'layer3',
        'layer4',
        'layer2',
        'layer5'
      ]);
      expect(this.collection.pluck('order')).toEqual([0, 1, 2, 3, 4]);
    });

    it('should reset orders when moving a layer down', function () {
      this.collection.moveLayer({ from: 3, to: 1 });

      expect(this.collection.pluck('id')).toEqual([
        'layer1',
        'layer4',
        'layer2',
        'layer3',
        'layer5'
      ]);
      expect(this.collection.pluck('order')).toEqual([0, 1, 2, 3, 4]);
    });

    it('should save the collection', function () {
      this.collection.moveLayer({ from: 3, to: 1 });

      expect(this.collection.save).toHaveBeenCalled();
    });

    it('should trigger a "sort" event', function () {
      var onAddCallback = jasmine.createSpy('onAddCallback');
      var onRemoveCallback = jasmine.createSpy('onRemoveCallback');

      this.collection.on('add', onAddCallback);
      this.collection.on('remove', onRemoveCallback);

      this.collection.moveLayer({ from: 3, to: 1 });

      expect(onAddCallback).toHaveBeenCalled();
      expect(onRemoveCallback).not.toHaveBeenCalled();
    });
  });
});
