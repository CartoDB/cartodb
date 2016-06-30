var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var LayerDefinitionsCollection = require('../../../../javascripts/cartodb3/data/layer-definitions-collection');
var WidgetDefinitionsCollection = require('../../../../javascripts/cartodb3/data/widget-definitions-collection');
var UserActions = require('../../../../javascripts/cartodb3/data/user-actions');

/**
 * Only test stuff that requires DOM related stuff, e.g. $
 */
describe('cartodb3/data/user-actions', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({base_url: '/u/pepe'});
    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
    });
    this.analysisDefinitionsCollection = new AnalysisDefinitionsCollection(null, {
      configModel: configModel,
      vizId: 'viz-123',
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      analysisDefinitionsCollection: this.analysisDefinitionsCollection,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'map-123',
      basemaps: {}
    });
    this.widgetDefinitionsCollection = new WidgetDefinitionsCollection(null, {
      configModel: configModel,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      mapId: 'map-123'
    });

    this.userActions = UserActions({
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      analysisDefinitionsCollection: this.analysisDefinitionsCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      widgetDefinitionsCollection: this.widgetDefinitionsCollection
    });

    // Fake requests working, by default
    this.originalAjax = Backbone.ajax;
    Backbone.ajax = function () {
      return {
        always: function (cb) {
          cb();
        }
      };
    };
  });

  afterEach(function () {
    Backbone.ajax = this.originalAjax;
  });

  describe('.moveLayer', function () {
    beforeEach(function () {
      this.layer1 = this.layerDefinitionsCollection.add({ id: 'layer1', order: 0, kind: 'tiled' });
      this.layer2 = this.layerDefinitionsCollection.add({ id: 'layer2', order: 1, kind: 'carto' });
      this.layer3 = this.layerDefinitionsCollection.add({ id: 'layer3', order: 2, kind: 'carto' });
      this.layer4 = this.layerDefinitionsCollection.add({ id: 'layer4', order: 3, kind: 'carto' });
      this.layer5 = this.layerDefinitionsCollection.add({ id: 'layer5', order: 4, kind: 'carto' });

      this.layerDefinitionsCollection.reset([
        this.layer1,
        this.layer2,
        this.layer3,
        this.layer4,
        this.layer5
      ]);
      this.layerDefinitionsCollection.sort();

      spyOn(this.layerDefinitionsCollection, 'save').and.callThrough();
    });

    it('should reset orders when moving a layer up', function () {
      this.userActions.moveLayer({ from: 1, to: 3 });

      expect(this.layerDefinitionsCollection.pluck('id')).toEqual([
        'layer1',
        'layer3',
        'layer4',
        'layer2',
        'layer5'
      ]);
      expect(this.layerDefinitionsCollection.pluck('order')).toEqual([0, 1, 2, 3, 4]);
    });

    it('should reset orders when moving a layer down', function () {
      this.userActions.moveLayer({ from: 3, to: 1 });

      expect(this.layerDefinitionsCollection.pluck('id')).toEqual([
        'layer1',
        'layer4',
        'layer2',
        'layer3',
        'layer5'
      ]);
      expect(this.layerDefinitionsCollection.pluck('order')).toEqual([0, 1, 2, 3, 4]);
    });

    it('should save the collection', function () {
      this.userActions.moveLayer({ from: 3, to: 1 });

      expect(this.layerDefinitionsCollection.save).toHaveBeenCalled();
    });

    it('should trigger a "layerMoved" event when collection is saved', function () {
      var onAddCallback = jasmine.createSpy('onAddCallback');
      var onRemoveCallback = jasmine.createSpy('onRemoveCallback');
      var onLayerMovedCallback = jasmine.createSpy('onLayerMovedCallback');

      this.layerDefinitionsCollection.on('add', onAddCallback);
      this.layerDefinitionsCollection.on('remove', onRemoveCallback);
      this.layerDefinitionsCollection.on('layerMoved', onLayerMovedCallback);

      this.userActions.moveLayer({ from: 3, to: 1 });

      this.layerDefinitionsCollection.save.calls.argsFor(0)[0].success();
      expect(onAddCallback).not.toHaveBeenCalled();
      expect(onRemoveCallback).not.toHaveBeenCalled();
      expect(onLayerMovedCallback).toHaveBeenCalled();
      expect(onLayerMovedCallback.calls.argsFor(0)[0].id).toEqual('layer4');
      expect(onLayerMovedCallback.calls.argsFor(0)[1]).toEqual(1);
      expect(onLayerMovedCallback.calls.argsFor(0)[2]).toBe(this.layerDefinitionsCollection);
    });

    it('should create analysis for layers that have a source', function () {
      this.analysisDefinitionNodesCollection.createSourceNode({id: 'a0', tableName: 'foo'});
      this.layer2.set('source', 'a0');
      this.analysisDefinitionNodesCollection.createSourceNode({id: 'b0', tableName: 'bar'});
      this.layer3.set('source', 'b0');

      spyOn(this.analysisDefinitionsCollection, 'create').and.callThrough();
      this.userActions.moveLayer({from: 3, to: 1});

      expect(this.analysisDefinitionsCollection.create).toHaveBeenCalled();
      expect(this.analysisDefinitionsCollection.length).toEqual(2);
      expect(this.analysisDefinitionsCollection.pluck('node_id')).toEqual(['a0', 'b0']);
    });
  });
});
