var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');
var LayerDefinitionsCollection = require('../../../../javascripts/cartodb3/data/layer-definitions-collection');
var WidgetDefinitionsCollection = require('../../../../javascripts/cartodb3/data/widget-definitions-collection');
var AnalysisFormModel = require('../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/base-analysis-form-model');
var WidgetOptionModel = require('../../../../javascripts/cartodb3/components/modals/add-widgets/widget-option-model');
var UserActions = require('../../../../javascripts/cartodb3/data/user-actions');

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
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'map-123'
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

  describe('.createAnalysisNode', function () {
    beforeEach(function () {
      spyOn(this.analysisDefinitionsCollection, 'create');

      this.a0 = this.analysisDefinitionNodesCollection.add({
        id: 'a0',
        type: 'source',
        params: {
          query: 'SELECT * FROM a_table'
        },
        options: {
          table_name: 'a_table'
        }
      });
    });

    describe('when given a node w/o analysis', function () {
      beforeEach(function () {
        this.layerDefModel = new Backbone.Model();
        spyOn(this.layerDefModel, 'save');

        var nodeAttrs = {
          id: 'a1',
          type: 'trade-area',
          source: 'a0',
          kind: 'walk',
          time: 123
        };

        this.nodeDefModel = this.userActions.createAnalysisNode(nodeAttrs, this.layerDefModel);
      });

      it('should create a new analysis', function () {
        expect(this.analysisDefinitionsCollection.create).toHaveBeenCalledWith({
          analysis_definition: jasmine.objectContaining({
            id: 'a1',
            type: 'trade-area'
          })
        });
      });

      it('should persist the given layer with new source and reset cartocss', function () {
        expect(this.layerDefModel.save).toHaveBeenCalledWith({
          source: 'a1',
          cartocss: jasmine.any(String)
        });
      });

      it('should return a new node', function () {
        expect(this.nodeDefModel).toBeDefined();
        expect(this.nodeDefModel.id).toEqual('a1');
      });
    });

    describe('when given attrs which source already is persisted', function () {
      beforeEach(function () {
        this.analysisDefModel = new Backbone.Model();
        spyOn(this.analysisDefModel, 'save');
        spyOn(this.analysisDefinitionsCollection, 'findByNodeId').and.returnValue(this.analysisDefModel);

        this.layerDefModel = new Backbone.Model();
        spyOn(this.layerDefModel, 'save');

        var nodeAttrs = {
          id: 'a1',
          type: 'trade-area',
          source: 'a0',
          kind: 'walk',
          time: 123
        };

        this.nodeDefModel = this.userActions.createAnalysisNode(nodeAttrs, this.layerDefModel);
      });

      it('should not create a new analysis', function () {
        expect(this.analysisDefinitionsCollection.create).not.toHaveBeenCalled();
      });

      it('should update the existing analysis with new node', function () {
        expect(this.analysisDefModel.save).toHaveBeenCalledWith({
          node_id: 'a1'
        });
      });

      it('should persist the given layer with new source and reset cartocss', function () {
        expect(this.layerDefModel.save).toHaveBeenCalledWith({
          source: 'a1',
          cartocss: jasmine.any(String)
        });
      });

      it('should return a new node', function () {
        expect(this.nodeDefModel).toBeDefined();
        expect(this.nodeDefModel.id).toEqual('a1');
      });
    });
  });

  describe('.updateOrCreateAnalysis', function () {
    beforeEach(function () {
      this.layerDefModel = new Backbone.Model({
        id: 'l1',
        type: 'CartoDB'
      });
      this.aFormModel = new AnalysisFormModel({
        id: 'a1',
        type: 'buffer',
        radius: 100,
        source: 'a0'
      }, {
        configModel: {},
        layerDefinitionModel: this.layerDefModel,
        analysisSourceOptionsModel: {}
      });
      spyOn(this.aFormModel, 'isValid');
    });

    it('should do nothing if not valid', function () {
      this.aFormModel.isValid.and.returnValue(false);
      this.userActions.updateOrCreateAnalysis(this.aFormModel);
    });

    describe('when valid', function () {
      beforeEach(function () {
        this.aFormModel.isValid.and.returnValue(true);
      });

      describe('when node-definition does not exist for given form-model', function () {
        beforeEach(function () {
          spyOn(this.aFormModel, 'createNodeDefinition');
          this.userActions.updateOrCreateAnalysis(this.aFormModel);
        });

        it('should delegate back to form model to create node', function () {
          expect(this.aFormModel.createNodeDefinition).toHaveBeenCalledWith(this.userActions);
        });
      });

      describe('when node-definition exist for given form-model', function () {
        beforeEach(function () {
          this.analysisDefModel = new Backbone.Model({node_id: 'a1'});
          spyOn(this.analysisDefModel, 'save');
          spyOn(this.analysisDefinitionsCollection, 'findAnalysisThatContainsNode').and.returnValue(this.analysisDefModel);

          this.a1 = this.analysisDefinitionNodesCollection.add({
            id: 'a1',
            type: 'buffer',
            radius: 100,
            source: 'a0'
          }, {parse: false});
          spyOn(this.aFormModel, 'updateNodeDefinition');

          this.userActions.updateOrCreateAnalysis(this.aFormModel);
        });

        it('should delegate back to form model to update the node-definition', function () {
          expect(this.aFormModel.updateNodeDefinition).toHaveBeenCalledWith(this.a1);
        });

        it('should persist the analysis change', function () {
          expect(this.analysisDefModel.save).toHaveBeenCalled();
          expect(this.analysisDefinitionsCollection.findAnalysisThatContainsNode).toHaveBeenCalledWith(this.a1);
        });
      });
    });
  });

  describe('.updateAnalysisSourceQuery', function () {
    beforeEach(function () {
      this.query = 'SELECT * FROM table';
      this.nodeDefModel = new Backbone.Model({
        id: 'a1',
        type: 'source'
      });
      this.layerDefModel = new Backbone.Model();
    });

    describe('when there is no analysis', function () {
      beforeEach(function () {
        spyOn(this.analysisDefinitionsCollection, 'create');
        spyOn(this.layerDefModel, 'save');
        this.userActions.updateAnalysisSourceQuery(this.query, this.nodeDefModel, this.layerDefModel);
      });

      it('should set query on analysis-definition-node-model', function () {
        var query = this.nodeDefModel.get('query');
        expect(query).toEqual(this.query);
        expect(_.isEmpty(query)).toBe(false);
      });

      it('should create a new analysis', function () {
        expect(this.analysisDefinitionsCollection.create).toHaveBeenCalledWith({
          analysis_definition: jasmine.objectContaining({
            id: 'a1',
            type: 'source'
          })
        });
      });

      it('should persist the layerDef', function () {
        expect(this.layerDefModel.save).toHaveBeenCalled();
      });
    });

    describe('when there is an persisted analysis already', function () {
      beforeEach(function () {
        this.aDefModel = new Backbone.Model();
        spyOn(this.aDefModel, 'save');
        spyOn(this.analysisDefinitionsCollection, 'findAnalysisThatContainsNode').and.returnValue(this.aDefModel);
        this.userActions.updateAnalysisSourceQuery(this.query, this.nodeDefModel, this.layerDefModel);
        expect(this.analysisDefinitionsCollection.findAnalysisThatContainsNode).toHaveBeenCalledWith(this.nodeDefModel);
      });

      it('should set query on analysis-definition-node-model', function () {
        var query = this.nodeDefModel.get('query');
        expect(query).toEqual(this.query);
        expect(_.isEmpty(query)).toBe(false);
      });

      it('should save the analysis that contains the affected node', function () {
        expect(this.aDefModel.save).toHaveBeenCalled();
      });
    });
  });

  describe('.updateOrCreateWidget', function () {
    beforeEach(function () {
      this.nodeDefModel = new Backbone.Model({
        id: 'a1',
        type: 'buffer'
      });

      this.layerDefModel = new Backbone.Model({});
      spyOn(this.layerDefModel, 'save');

      this.widgetOptionModel = new WidgetOptionModel({
        type: 'category'
      });
      spyOn(this.widgetOptionModel, 'analysisDefinitionNodeModel').and.returnValue(this.nodeDefModel);
      spyOn(this.widgetOptionModel, 'createUpdateOrSimilar');
      spyOn(this.analysisDefinitionsCollection, 'create');
    });

    describe('when source of widget is not yet persisted', function () {
      beforeEach(function () {
        spyOn(this.widgetOptionModel, 'layerDefinitionModel').and.returnValue(this.layerDefModel);

        this.userActions.updateOrCreateWidget(this.widgetOptionModel);
      });

      it('should create a new analysis', function () {
        expect(this.analysisDefinitionsCollection.create).toHaveBeenCalledWith({
          analysis_definition: jasmine.objectContaining({
            id: 'a1',
            type: 'buffer'
          })
        });
      });

      it('should persist layer', function () {
        expect(this.layerDefModel.save).toHaveBeenCalled();
      });

      it('should delegate side-effects to the option model', function () {
        expect(this.widgetOptionModel.createUpdateOrSimilar).toHaveBeenCalledWith(this.widgetDefinitionsCollection);
      });
    });

    describe('when source of widget is already persisted', function () {
      beforeEach(function () {
        this.aDefModel = new Backbone.Model();
        spyOn(this.analysisDefinitionsCollection, 'findAnalysisThatContainsNode').and.returnValue(this.aDefModel);

        this.userActions.updateOrCreateWidget(this.widgetOptionModel);
        expect(this.analysisDefinitionsCollection.findAnalysisThatContainsNode).toHaveBeenCalledWith(this.nodeDefModel);
      });

      it('should only delegate side-effects to the option model', function () {
        expect(this.widgetOptionModel.createUpdateOrSimilar).toHaveBeenCalledWith(this.widgetDefinitionsCollection);

        expect(this.analysisDefinitionsCollection.create).not.toHaveBeenCalled();
        expect(this.layerDefModel.save).not.toHaveBeenCalled();
      });
    });

    describe('when there is no analysis-definition-node-model available (e.g. time-series none-option)', function () {
      beforeEach(function () {
        spyOn(this.analysisDefinitionsCollection, 'findAnalysisThatContainsNode').and.returnValue(this.aDefModel);
        this.widgetOptionModel.analysisDefinitionNodeModel.and.returnValue(undefined);

        this.userActions.updateOrCreateWidget(this.widgetOptionModel);
      });

      it('should only delegate side-effects to the option model', function () {
        expect(this.widgetOptionModel.createUpdateOrSimilar).toHaveBeenCalledWith(this.widgetDefinitionsCollection);

        expect(this.analysisDefinitionsCollection.findAnalysisThatContainsNode).not.toHaveBeenCalledWith(this.nodeDefModel);
        expect(this.analysisDefinitionsCollection.create).not.toHaveBeenCalled();
        expect(this.layerDefModel.save).not.toHaveBeenCalled();
      });
    });
  });

  describe('.deleteAnalysisNode', function () {
    beforeEach(function () {
      // creates a nodes graph to test various scenarios:
      // a0         <-- head of layer A
      // c1         <-- head of layer C + widget
      //   b2
      //     b1     <-- head layer B
      //       b0   <-- widget
      //   c0
      this.analysisDefinitionsCollection.add([
        {
          id: 'persisted-a0',
          analysis_definition: {
            id: 'a0',
            type: 'source',
            params: {
              query: 'SELECT * FROM a_single_source'
            }
          }
        }, {
          id: 'persisted-c1',
          analysis_definition: {
            id: 'c1',
            type: 'point-in-polygon',
            params: {
              points_source: {
                id: 'b2',
                type: 'buffer',
                params: {
                  source: {
                    id: 'b1',
                    type: 'trade-area',
                    params: {
                      source: {
                        id: 'b0',
                        type: 'source',
                        params: {
                          query: 'SELECT * FROM bar'
                        }
                      },
                      kind: 'walk',
                      time: 300,
                      dissolved: true,
                      isolines: 3
                    }
                  },
                  radius: 20
                }
              },
              polygons_source: {
                id: 'c0',
                type: 'source',
                params: {
                  query: 'SELECT * FROM my_polygons'
                }
              }
            },
            options: {
              primary_source_name: 'polygons_source'
            }
          }
        }
      ]);
      this.analysisDefinitionNodesCollection.add({
        id: 'orphan',
        type: 'source',
        params: {
          query: 'SELECT * FROM orphan'
        }
      });

      this.layerDefinitionsCollection.add([
        {
          id: 'A',
          kind: 'carto',
          options: {
            letter: 'a',
            source: 'a0'
          }
        },
        {
          id: 'B',
          kind: 'carto',
          options: {
            letter: 'b',
            source: 'b2'
          }
        }, {
          id: 'C',
          kind: 'carto',
          options: {
            letter: 'c',
            source: 'c1'
          }
        }
      ]);

      this.widgetDefinitionsCollection.add([
        {
          id: 'for-b0',
          type: 'formula',
          source: {
            id: 'b0'
          }
        }, {
          id: 'for-c1',
          type: 'formula',
          source: {
            id: 'c1'
          }
        }
      ]);

      expect(this.analysisDefinitionNodesCollection.pluck('id')).toEqual(['a0', 'b0', 'b1', 'b2', 'c0', 'c1', 'orphan'], 'should have created individual nodes');
    });

    it('should do nothing if the node does not exist', function () {
      expect(this.userActions.deleteAnalysisNode('x1')).toBe(false);
      expect(this.userActions.deleteAnalysisNode('')).toBe(false);
      expect(this.userActions.deleteAnalysisNode(undefined)).toBe(false);
      expect(this.userActions.deleteAnalysisNode(null)).toBe(false);
      expect(this.userActions.deleteAnalysisNode(true)).toBe(false);
    });

    describe('when given a source node', function () {
      describe('when source node have no dependent objects', function () {
        beforeEach(function () {
          this.orphan = this.analysisDefinitionNodesCollection.get('orphan');
          spyOn(this.orphan, 'destroy').and.callThrough();

          this.userActions.deleteAnalysisNode('orphan');
        });

        it('should only delete the node', function () {
          expect(this.orphan.destroy).toHaveBeenCalled();
          expect(this.analysisDefinitionNodesCollection.pluck('id')).not.toContain('orphan');
          expect(this.analysisDefinitionNodesCollection.length).toEqual(6);
        });
      });

      describe('when source node have dependent objects', function () {
        beforeEach(function () {
          this.b0 = this.analysisDefinitionNodesCollection.get('b0');
          spyOn(this.b0, 'destroy').and.callThrough();

          this.userActions.deleteAnalysisNode('b0');
        });

        it('should delete dependent nodes', function () {
          expect(this.analysisDefinitionNodesCollection.pluck('id')).toEqual(['a0']);
        });

        it('should delete dependent analysis', function () {
          expect(this.analysisDefinitionsCollection.pluck('node_id')).toEqual(['a0']);
        });

        it('should delete dependent layers', function () {
          expect(this.layerDefinitionsCollection.pluck('source')).toEqual(['a0']);
        });

        it('should delete dependent widgets', function () {
          expect(this.widgetDefinitionsCollection.pluck('source')).toEqual([]);
        });

        it('should delete node', function () {
          expect(this.b0.destroy).toHaveBeenCalled();
        });
      });
    });

    describe('when given a head node w/o any dependent nodes', function () {
      beforeEach(function () {
        this.c1 = this.analysisDefinitionNodesCollection.get('c1');
        this.C = this.layerDefinitionsCollection.get('C');

        spyOn(this.c1, 'destroy').and.callThrough();
        spyOn(this.C, 'save').and.callThrough();
        spyOn(this.analysisDefinitionsCollection, 'create').and.callThrough();

        this.userActions.deleteAnalysisNode('c1');
      });

      it('should delete dependent nodes', function () {
        expect(this.analysisDefinitionNodesCollection.pluck('id')).not.toContain('c1');
        expect(this.analysisDefinitionNodesCollection.pluck('id')).toEqual(['a0', 'b0', 'b1', 'b2', 'c0'], 'c1 and its primary source c0 should have been removed');
      });

      it('should have persisted analysis', function () {
        expect(this.analysisDefinitionsCollection.pluck('node_id')).toEqual(['a0', 'c0']);
      });

      it('should update layer to point to new head', function () {
        expect(this.C.save).toHaveBeenCalled();
        expect(this.C.get('source')).toEqual('c0');
        expect(this.layerDefinitionsCollection.pluck('source')).toEqual(['a0', 'b2', 'c0']);
      });

      it('should delete dependent widgets', function () {
        expect(this.widgetDefinitionsCollection.pluck('source')).toEqual(['b0']);
      });

      it('should delete node', function () {
        expect(this.c1.destroy).toHaveBeenCalled();
      });
    });

    describe('when given a head node which have dependent nodes', function () {
      beforeEach(function () {
        this.b2 = this.analysisDefinitionNodesCollection.get('b2');
        this.B = this.layerDefinitionsCollection.get('B');

        spyOn(this.b2, 'destroy').and.callThrough();
        spyOn(this.B, 'save').and.callThrough();
        spyOn(this.analysisDefinitionsCollection, 'create').and.callThrough();

        this.userActions.deleteAnalysisNode('b2');
      });

      it('should delete dependent nodes', function () {
        var nodeIds = this.analysisDefinitionNodesCollection.pluck('id');
        expect(nodeIds).not.toContain('b2');
        expect(nodeIds).not.toContain('c1');
        expect(nodeIds).not.toContain('c0');
        expect(nodeIds).toEqual(['a0', 'b0', 'b1']);
      });

      it('should delete analysis for C', function () {
        expect(this.analysisDefinitionsCollection.pluck('node_id')).not.toContain('c1');
      });

      it('should have created a new analysis for the remaining b0', function () {
        expect(this.analysisDefinitionsCollection.create).toHaveBeenCalled();
        expect(this.analysisDefinitionsCollection.pluck('node_id')).toContain('b1');
      });

      it('should update layer B to point to new head', function () {
        expect(this.B.save).toHaveBeenCalled();
        expect(this.B.get('source')).toEqual('b1');
      });

      it('should delete C layer', function () {
        expect(this.layerDefinitionsCollection.pluck('id')).toEqual(['A', 'B']);
      });

      it('should not affect widgets', function () {
        expect(this.widgetDefinitionsCollection.pluck('source')).toEqual(['b0']);
      });

      it('should delete node', function () {
        expect(this.b2.destroy).toHaveBeenCalled();
      });
    });

    describe('when given a node which is neither a head or source', function () {
      beforeEach(function () {
        this.b1 = this.analysisDefinitionNodesCollection.get('b1');

        spyOn(this.b1, 'destroy').and.callThrough();
        spyOn(this.analysisDefinitionsCollection, 'create').and.callThrough();

        this.userActions.deleteAnalysisNode('b1');
      });

      it('should delete dependent nodes', function () {
        var nodeIds = this.analysisDefinitionNodesCollection.pluck('id');
        expect(nodeIds).not.toContain('b2');
        expect(nodeIds).not.toContain('b1');
        expect(nodeIds).not.toContain('c1');
        expect(nodeIds).toEqual(['a0', 'b0']);
      });

      it('should have created a new analysis for the remaining b0', function () {
        expect(this.analysisDefinitionsCollection.create).toHaveBeenCalled();
        expect(this.analysisDefinitionsCollection.pluck('node_id')).toContain('b0');
      });

      it('should delete analysis for C', function () {
        expect(this.analysisDefinitionsCollection.pluck('node_id')).not.toContain('c1');
      });

      it('should delete affected layers', function () {
        expect(this.layerDefinitionsCollection.pluck('id')).toEqual(['A']);
      });

      it('should not affect widgets', function () {
        expect(this.widgetDefinitionsCollection.pluck('source')).toEqual(['b0']);
      });

      it('should delete node', function () {
        expect(this.b1.destroy).toHaveBeenCalled();
      });
    });
  });

  describe('.createLayerForTable', function () {
    it('should create layer with infowindows and tooltips', function () {
      var newLayer = this.userActions.createLayerForTable('tableName');
      expect(newLayer.get('infowindow')).toBeDefined();
      expect(newLayer.get('tooltip')).toBeDefined();
    });

    it('should create a new analysis for the source', function () {
      var newLayer = this.userActions.createLayerForTable('foobar');
      var analysisDefModel = this.analysisDefinitionsCollection.findByNodeId(newLayer.get('source'));
      expect(analysisDefModel).toBeDefined();

      var nodeDefModel = this.analysisDefinitionNodesCollection.get(newLayer.get('source'));
      expect(nodeDefModel).toBeDefined();
      expect(nodeDefModel.attributes).toEqual({
        id: 'a0',
        type: 'source',
        table_name: 'foobar',
        query: 'SELECT * FROM foobar'
      });
    });

    it('should invoke the success callback if layer is correctly created', function () {
      spyOn(this.layerDefinitionsCollection, 'create');
      var successCallback = jasmine.createSpy('successCallback');

      this.userActions.createLayerForTable('tableName', { success: successCallback });

      this.layerDefinitionsCollection.create.calls.argsFor(0)[1].success();

      expect(successCallback).toHaveBeenCalled();
    });

    it('should invoke the error callback if layer creation fails', function () {
      spyOn(this.layerDefinitionsCollection, 'create');
      var errorCallback = jasmine.createSpy('errorCallback');

      this.userActions.createLayerForTable('tableName', { error: errorCallback });

      this.layerDefinitionsCollection.create.calls.argsFor(0)[1].error();

      expect(errorCallback).toHaveBeenCalled();
    });

    it('should place the layer below the "Tiled" layer on top', function () {
      var TiledLayer = new Backbone.Model({
        type: 'Tiled',
        order: 1
      });
      var CartoDBLayer = new Backbone.Model({
        type: 'CartoDB',
        order: 0
      });
      this.layerDefinitionsCollection.reset([
        CartoDBLayer,
        TiledLayer
      ]);

      spyOn(this.layerDefinitionsCollection, 'create').and.callThrough();
      spyOn(this.layerDefinitionsCollection, 'save').and.callThrough(); // TODO callthrough?

      var newCartoDBLayer = this.userActions.createLayerForTable('tableName');

      expect(this.layerDefinitionsCollection.models).toEqual([ CartoDBLayer, newCartoDBLayer, TiledLayer ]);
      expect(this.layerDefinitionsCollection.pluck('order')).toEqual([ 0, 1, 2 ]);

      // Layer is created successfully
      this.layerDefinitionsCollection.create.calls.argsFor(0)[1].success();

      expect(this.layerDefinitionsCollection.save).toHaveBeenCalled();
    });

    it('should place the layer below the "Torque" layer on top', function () {
      var TorqueLayer = new Backbone.Model({
        id: 'torque-layer',
        type: 'torque',
        order: 1
      });
      var CartoDBLayer = new Backbone.Model({
        id: 'cartodb-layer',
        type: 'CartoDB',
        order: 0
      });
      this.layerDefinitionsCollection.reset([
        CartoDBLayer,
        TorqueLayer
      ]);

      spyOn(this.layerDefinitionsCollection, 'create').and.callThrough();
      spyOn(this.layerDefinitionsCollection, 'save').and.callThrough();
      var newCartoDBLayer = this.userActions.createLayerForTable('tableName');
      newCartoDBLayer.set('id', 'NEW-layer');

      expect(this.layerDefinitionsCollection.pluck('id')).toEqual([ 'cartodb-layer', 'NEW-layer', 'torque-layer' ]);
      expect(this.layerDefinitionsCollection.pluck('order')).toEqual([ 0, 1, 2 ]);

      // Layer is created successfully
      this.layerDefinitionsCollection.create.calls.argsFor(0)[1].success();
      expect(this.layerDefinitionsCollection.save).toHaveBeenCalled();
    });

    it('should place the new layer above the "CartoDB" layer on top', function () {
      var TiledLayer_1 = new Backbone.Model({
        type: 'Tiled',
        order: 1
      });
      spyOn(TiledLayer_1, 'save');
      var CartoDBLayer_0 = new Backbone.Model({
        id: 'layer-0',
        type: 'CartoDB',
        order: 0
      });
      var CartoDBLayer_1 = new Backbone.Model({
        id: 'layer-1',
        type: 'CartoDB',
        order: 1
      });
      this.layerDefinitionsCollection.reset([
        CartoDBLayer_0,
        CartoDBLayer_1
      ]);

      spyOn(this.layerDefinitionsCollection, 'create').and.callThrough();
      spyOn(this.layerDefinitionsCollection, 'save').and.callThrough();

      var newLayer = this.userActions.createLayerForTable('tableName');
      newLayer.set('id', 'new-layer');

      expect(this.layerDefinitionsCollection.pluck('id')).toEqual([ 'layer-0', 'layer-1', 'new-layer' ]);
      expect(this.layerDefinitionsCollection.pluck('order')).toEqual([ 0, 1, 2 ]);

      // Layer is created successfully
      this.layerDefinitionsCollection.create.calls.argsFor(0)[1].success();

      // Order of other layers has not been changed
      expect(this.layerDefinitionsCollection.save).toHaveBeenCalled();
    });
  });

  describe('.createLayerForAnalysisNode', function () {
    var userActions;

    beforeEach(function () {
      userActions = this.userActions;
      this.analysisDefinitionsCollection.add({
        id: '1st',
        analysis_definition: {
          id: 'a2',
          type: 'trade-area',
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
                  },
                  options: {
                    table_name: 'something'
                  }
                }
              }
            }
          }
        }
      });

      this.widgetDefinitionsCollection.add({
        id: 'should-not-change',
        type: 'formula',
        source: {
          id: 'w101'
        }
      });
    });

    it('should not allow to create layer below or on basemap', function () {
      expect(function () { userActions.createLayerForAnalysisNode('a1', 0); }).toThrowError(/base layer/);
      expect(function () { userActions.createLayerForAnalysisNode('a1', null); }).toThrowError(/base layer/);
      expect(function () { userActions.createLayerForAnalysisNode('a1'); }).toThrowError(/base layer/);
    });

    it('should throw an error if given node does not exist', function () {
      expect(function () { userActions.createLayerForAnalysisNode('x1', 0); }).toThrowError(/does not exist/);
    });

    describe('when given node is a source node', function () {
      beforeEach(function () {
        this.layerDefModel = this.layerDefinitionsCollection.add({
          id: 'l1',
          order: 1,
          kind: 'carto',
          options: {
            source: 'a0'
          }
        });

        spyOn(this.layerDefinitionsCollection, 'create').and.callThrough();
        spyOn(this.userActions, 'createLayerForTable').and.callThrough();
        this.userActions.createLayerForAnalysisNode('a0', 2);
        this.newLayerDefModel = this.layerDefinitionsCollection.last();
      });

      it('should create a new layer duplicating the given node', function () {
        expect(this.userActions.createLayerForTable).toHaveBeenCalledWith('something', {order: 2});
      });
    });

    // Node is NOT a head of a node, e.g. given nodeId is 'a2' this would create a new layer B which takes over the
    // ownership of the given node and its underlying nodes
    //   _______       _______   ______
    //  | A    |      | A    |  | B    |
    //  |      |      |      |  |      |
    //  | [A3] |      | [A3] |  | {B2} |
    //  | {A2} |  =>  | {B2} |  | [B1] |
    //  | [A1] |      |      |  | [B0] |
    //  | [A0] |      |      |  |      |
    //  |______|      |______|  |______|
    describe('when given node is NOT a head of any layer', function () {
      beforeEach(function () {
        this.analysisDefinitionsCollection.reset([{
          id: '1nd',
          analysis_definition: {
            id: 'a4',
            type: 'buffer',
            params: {
              radius: 40,
              source: {
                id: 'a3',
                type: 'buffer',
                params: {
                  radius: 30,
                  source: this.analysisDefinitionNodesCollection.get('a2').toJSON()
                }
              }
            }
          }
        }]);

        this.layerDefModel = this.layerDefinitionsCollection.add({
          id: 'l1',
          order: 1,
          kind: 'carto',
          options: {
            table_name: 'foobar',
            cartocss: 'before',
            source: 'a4'
          }
        });

        this.widgetDefinitionsCollection.add({
          id: 'should-change',
          type: 'formula',
          source: {
            id: 'a2'
          }
        });

        spyOn(this.layerDefinitionsCollection, 'create').and.callThrough();
      });

      describe('when analysis exist', function () {
        beforeEach(function () {
          this.analysisDefModel = this.analysisDefinitionsCollection.findByNodeId('a4');
          spyOn(this.analysisDefModel, 'save').and.callThrough();
          this.userActions.createLayerForAnalysisNode('a2', 2);
        });

        describe('should create new layer with', function () {
          beforeEach(function () {
            expect(this.layerDefinitionsCollection.pluck('letter')).toEqual(['a', 'b']);
            this.newLayerDefModel = this.layerDefinitionsCollection.last();
          });

          it('source pointing to new node', function () {
            expect(this.analysisDefinitionNodesCollection.get('b2')).toBeDefined();
            expect(this.newLayerDefModel.get('source')).toEqual('b2');
          });

          it('table name of prev layer', function () {
            expect(this.newLayerDefModel.get('table_name')).toEqual('foobar');
          });
        });

        it('should still have same unaffected nodes on layer A', function () {
          expect(this.layerDefModel.get('source')).toEqual('a4');
          expect(this.analysisDefinitionNodesCollection.get('a4')).toBeDefined();
          expect(this.analysisDefinitionNodesCollection.get('a3')).toBeDefined();
        });

        it('the head of the moved node should now point to the head of the new layer B', function () {
          expect(this.analysisDefinitionNodesCollection.get('a3').get('source')).toEqual('b2');
        });

        it('should have created new node from the sub-tree of the given node', function () {
          expect(this.analysisDefinitionNodesCollection.get('b2')).toBeDefined();
          expect(this.analysisDefinitionNodesCollection.get('b1')).toBeDefined();
          expect(this.analysisDefinitionNodesCollection.get('b0')).toBeDefined();
        });

        it('should have removed the underlying no-longer-used nodes', function () {
          expect(this.analysisDefinitionNodesCollection.get('a2')).toBeUndefined();
          expect(this.analysisDefinitionNodesCollection.get('a1')).toBeUndefined();
          expect(this.analysisDefinitionNodesCollection.get('a0')).toBeUndefined();
        });

        it('should save the node graph', function () {
          expect(this.analysisDefModel.save).toHaveBeenCalled();
          expect(this.analysisDefinitionsCollection.pluck('node_id')).toEqual(['a4'], 'the new node should be contained in the a4 graph still');
        });

        describe('when created a layer successfully', function () {
          beforeEach(function () {
            spyOn(this.layerDefinitionsCollection, 'save').and.callThrough();
            this.layerDefinitionsCollection.create.calls.argsFor(0)[1].success();
          });

          it('should reset orders', function () {
            expect(this.layerDefinitionsCollection.pluck('order')).toEqual([0, 1]);
          });

          it('should save layers', function () {
            expect(this.layerDefinitionsCollection.save).toHaveBeenCalled();
          });
        });

        it('should updated affected widgets', function () {
          expect(this.widgetDefinitionsCollection.pluck('source')).toEqual(['w101', 'b2']);
        });
      });

      describe('when analysis does not exist yet', function () {
        beforeEach(function () {
          this.analysisDefinitionsCollection.reset(); // to remove existing a4
          spyOn(this.analysisDefinitionsCollection, 'create').and.callThrough();
          this.userActions.createLayerForAnalysisNode('a2', 2);
        });

        it('should create a new analysis', function () {
          expect(this.analysisDefinitionsCollection.create).toHaveBeenCalled();

          expect(this.analysisDefinitionsCollection.pluck('node_id')).toEqual(['a4']);
        });
      });
    });

    // Node is head of a layer, e.g. given nodeId A3 it should rename prev layer (A => B), and create a new layer (A)
    // where the prev layer was to take over its letter identity and its primary source (A2).
    // The motivation for this is to maintain the layer's state (styles, popup etc.) which really depends on the
    // last analysis output than the layer itself:
    //   _______       _______   ______
    //  | A    |      | A    |  | B    | <-- note that B is really A which just got moved & had it's nodes renamed
    //  |      |      |      |  |      |
    //  | [A2] |  =>  |      |  | {B1} |
    //  | [A1] |      | [A1] |  | [A1] |
    //  | [A0] |      | [A0] |  |      |
    //  |______|      |______|  |______|
    describe('when given node is head of a layer', function () {
      beforeEach(function () {
        this.layerDefModel = this.layerDefinitionsCollection.add({
          id: 'l1',
          order: 1,
          kind: 'carto',
          options: {
            table_name: 'foobar',
            cartocss: 'before',
            source: 'a2'
          }
        });
        spyOn(LayerDefinitionModel.prototype, 'save').and.callThrough();
        this.widgetDefinitionsCollection.add({
          id: 'should-change',
          type: 'formula',
          source: {
            id: 'a2'
          }
        });
      });

      describe('when analysis exists', function () {
        beforeEach(function () {
          this.analysisDefModel = this.analysisDefinitionsCollection.findByNodeId('a2');
          spyOn(this.analysisDefModel, 'save').and.callThrough();
          this.userActions.createLayerForAnalysisNode('a2', 2);
        });

        it('should have created a new layer that takes over the position of layer with head node', function () {
          expect(this.layerDefinitionsCollection.pluck('letter')).toEqual(['a', 'b']);
        });

        it('should change the source layer to appear as the new layer B', function () {
          expect(this.layerDefModel.get('letter')).toEqual('b');
          expect(this.layerDefModel.get('source')).toEqual('b1');
        });

        it('should create a new layer which appears to be the source layer A (to preserve styles, popups etc.)', function () {
          var newLayerDefModel = this.layerDefinitionsCollection.at(0);
          expect(newLayerDefModel.get('source')).toEqual('a1');
          expect(newLayerDefModel.get('letter')).toEqual('a');
          expect(newLayerDefModel.get('table_name')).toEqual('foobar');
        });

        it('should remove old head node', function () {
          expect(this.analysisDefinitionNodesCollection.get('a2')).toBeUndefined('should no longer exist since replaced by b1');
        });

        it('should update the analysis to point to the new head id', function () {
          expect(this.analysisDefModel.save).toHaveBeenCalled();
          expect(this.analysisDefinitionsCollection.pluck('node_id')).toEqual(['b1']);
        });

        describe('when created a layer successfully', function () {
          beforeEach(function () {
            spyOn(this.layerDefinitionsCollection, 'save').and.callThrough();
            LayerDefinitionModel.prototype.save.calls.argsFor(1)[1].success();
          });

          it('should reset order', function () {
            expect(this.layerDefinitionsCollection.pluck('order')).toEqual([0, 1]);
          });

          it('should save layers', function () {
            expect(this.layerDefinitionsCollection.save).toHaveBeenCalled();
          });
        });

        it('should updated affected widgets', function () {
          expect(this.widgetDefinitionsCollection.pluck('source')).toEqual(['w101', 'b1']);
        });
      });

      describe('when analysis does not exist', function () {
        beforeEach(function () {
          this.analysisDefinitionsCollection.reset();
          spyOn(this.analysisDefinitionsCollection, 'create').and.callThrough();
          this.userActions.createLayerForAnalysisNode('a2', 2);
        });

        it('should create a analysis', function () {
          expect(this.analysisDefinitionsCollection.pluck('node_id')).toEqual(['b1']);
          expect(this.analysisDefinitionsCollection.create).toHaveBeenCalled();
        });
      });
    });
  });

  describe('.deleteLayer', function () {
    beforeEach(function () {
      /**
       * Layer deletion have a lot of complexity to it, so the before-each has a very complicated setup on purpose,
       * to be able to assert the side-effects of various scenarios and corner cases.
       */
      this.analysisDefinitionsCollection.add([
        {
          id: 'a1-saved',
          analysis_definition: {
            id: 'a1',
            type: 'buffer',
            params: {
              radius: 100,
              source: {
                id: 'a0',
                type: 'source',
                params: {
                  query: 'SELECT * FROM something'
                },
                options: {
                  table_name: 'something'
                }
              }
            }
          }
        }, {
          id: 'b2-saved',
          analysis_definition: {
            id: 'b2',
            type: 'intersection',
            params: {
              source: {
                id: 'b1',
                type: 'buffer',
                params: {
                  radius: 100,
                  source: {
                    id: 'b0',
                    type: 'source',
                    params: {
                      query: 'SELECT * FROM something'
                    }
                  }
                }
              },
              target: {
                id: 'a0' // already added before
              }
            }
          }
        }, {
          id: 'c2-saved',
          analysis_definition: {
            id: 'c2', // already added before
            type: 'buffer',
            params: {
              radius: 100,
              source: {
                id: 'c1',
                type: 'buffer',
                params: {
                  radius: 100,
                  source: {
                    id: 'b2' // alredy added before
                  }
                }
              }
            }
          }
        }, {
          id: 'd2-saved',
          analysis_definition: {
            id: 'd2',
            type: 'point-in-polygon',
            params: {
              points_source: {
                id: 'd1',
                type: 'buffer',
                params: {
                  radius: 100,
                  source: {
                    id: 'c1' // already added before
                  }
                }
              },
              polygons_source: {
                id: 'c2', // already added before
                type: 'buffer',
                params: {
                  radius: 100,
                  source: {
                    id: 'c1' // already added before
                  }
                }
              }
            },
            options: {
              primary_source_name: 'points_source'
            }
          }
        }, {
          id: 'e1-saved',
          analysis_definition: {
            id: 'e1',
            type: 'buffer',
            params: {
              radius: 100,
              source: {
                id: 'c1' // already added --^
              }
            }
          }
        }
      ]);

      this.layerDefModel = this.layerDefinitionsCollection.add([
        {
          id: 'basemap',
          order: 0,
          kind: 'tiled'
        }, {
          id: 'A',
          order: 1,
          kind: 'carto',
          options: {
            letter: 'a',
            table_name: 'something',
            cartocss: 'before',
            source: 'a1'
          }
        }, {
          id: 'B',
          order: 2,
          kind: 'carto',
          options: {
            letter: 'b',
            table_name: 'something',
            cartocss: 'before',
            source: 'b2'
          }
        }, {
          id: 'C',
          order: 3,
          kind: 'carto',
          options: {
            letter: 'c',
            table_name: 'something',
            cartocss: 'before',
            source: 'c2'
          }
        }, {
          id: 'D',
          order: 4,
          kind: 'carto',
          options: {
            letter: 'd',
            table_name: 'something',
            cartocss: 'before',
            source: 'd2'
          }
        }, {
          id: 'E',
          order: 5,
          kind: 'carto',
          options: {
            letter: 'e',
            table_name: 'something',
            cartocss: 'before',
            source: 'e1'
          }
        }
      ]);

      this.widgetDefinitionsCollection.add([
        {
          id: 'w-b1',
          type: 'formula',
          source: {
            id: 'b1'
          }
        }, {
          id: 'w-b2',
          type: 'formula',
          source: {
            id: 'b2'
          }
        }, {
          id: 'w-c1',
          type: 'formula',
          source: {
            id: 'c1'
          }
        }, {
          id: 'w-d2',
          type: 'formula',
          source: {
            id: 'd2'
          }
        }, {
          id: 'w-e1',
          type: 'formula',
          source: {
            id: 'e1'
          }
        }
      ]);

      this.deferred = jasmine.createSpyObj('$.Deferred', ['done', 'fail']);
      $.when = {apply: jasmine.createSpy('$.when').and.returnValue(this.deferred)};
    });

    describe('when given a basemap', function () {
      beforeEach(function () {
        this.userActions.deleteLayer('basemap');
      });

      it('should throw an error since user should not be able to delete it explicitly', function () {
        expect(this.layerDefinitionsCollection.first().id).toEqual('basemap');
        expect(this.layerDefinitionsCollection.pluck('id')).toEqual(['basemap', 'A', 'B', 'C', 'D', 'E']);
      });
    });

    describe('when given a layer w/o any dependent nodes (E)', function () {
      beforeEach(function () {
        this.successSpy = jasmine.createSpy('success');
        this.errorSpy = jasmine.createSpy('error');
        expect(this.layerDefinitionsCollection.get('E').canBeDeletedByUser()).toBe(true, 'should be able to delete layer');

        this.userActions.deleteLayer('E', {
          success: this.successSpy,
          error: this.errorSpy
        });
      });

      it('should delete the layer', function () {
        expect(this.layerDefinitionsCollection.pluck('id')).toEqual(['basemap', 'A', 'B', 'C', 'D'], 'should exclude E');
      });

      it('should delete affected widgets', function () {
        expect(this.widgetDefinitionsCollection.pluck('source')).toEqual(['b1', 'b2', 'c1', 'd2'], 'should exlude e1');
      });

      it('should have persisted the remaining layers', function () {
        expect(this.analysisDefinitionsCollection.pluck('node_id')).toEqual(['a1', 'b2', 'c2', 'd2'], 'should delete e1');
      });

      it('should delete orphaned nodes', function () {
        expect(this.analysisDefinitionNodesCollection.pluck('id').sort()).toEqual(['a0', 'a1', 'b0', 'b1', 'b2', 'c1', 'c2', 'd1', 'd2'], 'should exclude e1');
      });

      describe('when done', function () {
        beforeEach(function () {
          expect(this.successSpy).not.toHaveBeenCalled();
          expect(this.errorSpy).not.toHaveBeenCalled();

          expect(this.deferred.done).toHaveBeenCalled();
          this.deferred.done.calls.argsFor(0)[0]();
        });

        it('should have called done callback', function () {
          expect(this.successSpy).toHaveBeenCalled();
          expect(this.errorSpy).not.toHaveBeenCalled();
        });
      });

      describe('when fail', function () {
        beforeEach(function () {
          expect(this.successSpy).not.toHaveBeenCalled();
          expect(this.errorSpy).not.toHaveBeenCalled();

          expect(this.deferred.fail).toHaveBeenCalled();
          this.err = {};
          this.deferred.fail.calls.argsFor(0)[0](this.err);
        });

        it('should have called error callback', function () {
          expect(this.errorSpy).toHaveBeenCalledWith(this.err);
          expect(this.successSpy).not.toHaveBeenCalled();
        });
      });
    });

    describe('when given a layer w/o any dependent nodes (D)', function () {
      beforeEach(function () {
        expect(this.layerDefinitionsCollection.get('D').canBeDeletedByUser()).toBe(true, 'should be able to delete layer');
        this.userActions.deleteLayer('D');
      });

      it('should delete the layer', function () {
        expect(this.layerDefinitionsCollection.pluck('id')).toEqual(['basemap', 'A', 'B', 'C', 'E'], 'should exclude D');
      });

      it('should delete affected widgets', function () {
        expect(this.widgetDefinitionsCollection.pluck('source')).toEqual(['b1', 'b2', 'c1', 'e1'], 'should exclude d2');
      });

      it('should persist analyses', function () {
        expect(this.analysisDefinitionsCollection.pluck('node_id')).toEqual(['a1', 'b2', 'c2', 'e1'], 'should exclude d2');
      });

      it('should delete orphaned nodes', function () {
        expect(this.analysisDefinitionNodesCollection.pluck('id').sort()).toEqual(['a0', 'a1', 'b0', 'b1', 'b2', 'c1', 'c2', 'e1'], 'should exclude [d2, d2]');
      });
    });

    describe('when given a layer with a primary dependent layer further down the linked nodes list (C)', function () {
      beforeEach(function () {
        expect(this.layerDefinitionsCollection.get('C').canBeDeletedByUser()).toBe(true, 'should be able to delete layer');
        this.userActions.deleteLayer('C');
      });

      it('should delete affected layers', function () {
        expect(this.layerDefinitionsCollection.pluck('id')).toEqual(['basemap', 'A', 'B', 'E'], 'should exclude [C,D]');
      });

      it('should update the parent layer found with new source', function () {
        expect(this.layerDefinitionsCollection.get('E').get('source')).toEqual('e2');
      });

      it('should updated affected widgets', function () {
        expect(this.widgetDefinitionsCollection
          .map(function (m) {
            return [m.id, m.get('source')];
          }))
          .toEqual([['w-b1', 'b1'], ['w-b2', 'b2'], ['w-c1', 'e1'], ['w-e1', 'e2']], 'should exclude [c2, d2], and changed w-e1 => e2');
      });

      it('should persist analyses', function () {
        expect(this.analysisDefinitionsCollection.pluck('node_id')).toEqual(['a1', 'b2', 'e2']);
      });

      it('should delete orphaned nodes', function () {
        expect(this.analysisDefinitionNodesCollection.pluck('id').sort()).toEqual(['a0', 'a1', 'b0', 'b1', 'b2', 'e1', 'e2'], 'should exclude [c2, d2, d2]');
      });
    });

    describe('when given layer with a primary dependent layer on the head node (B)', function () {
      beforeEach(function () {
        expect(this.layerDefinitionsCollection.get('B').canBeDeletedByUser()).toBe(true, 'should be able to delete layer');
        this.userActions.deleteLayer('B');
      });

      it('should delete layer', function () {
        expect(this.layerDefinitionsCollection.pluck('id')).toEqual(['basemap', 'A', 'C', 'D', 'E'], 'should exclude B only');
      });

      it('should update the parent layer found with new source', function () {
        expect(this.layerDefinitionsCollection.get('C').get('source')).toEqual('c4');
      });

      it('should updated affected widgets', function () {
        expect(this.widgetDefinitionsCollection
          .map(function (m) {
            return [m.id, m.get('source')];
          }))
          .toEqual([['w-b1', 'c1'], ['w-b2', 'c2'], ['w-c1', 'c3'], ['w-d2', 'd2'], ['w-e1', 'e1']], 'should exclude update sources');
      });

      it('should persist analyses', function () {
        expect(this.analysisDefinitionsCollection.pluck('node_id')).toEqual(['a1', 'c4', 'd2', 'e1']);
      });

      it('should delete orphaned nodes', function () {
        expect(this.analysisDefinitionNodesCollection.pluck('id').sort()).toEqual(['a0', 'a1', 'c0', 'c1', 'c2', 'c3', 'c4', 'd1', 'd2', 'e1'], 'should exclude [c2, d2, d2]');
      });
    });

    describe('when given a layer which all other layers depend on (A)', function () {
      beforeEach(function () {
        spyOn(Backbone.Model.prototype, 'destroy');
        spyOn(Backbone.Model.prototype, 'save');
        spyOn(Backbone.Collection.prototype, 'create');

        expect(this.layerDefinitionsCollection.get('A').canBeDeletedByUser()).toBe(false);
        this.userActions.deleteLayer('A');
      });

      it('should not delete anything', function () {
        expect(this.layerDefinitionsCollection.pluck('id')).toEqual(['basemap', 'A', 'B', 'C', 'D', 'E']);

        expect(Backbone.Model.prototype.destroy).not.toHaveBeenCalled();
        expect(Backbone.Model.prototype.save).not.toHaveBeenCalled();
        expect(Backbone.Collection.prototype.create).not.toHaveBeenCalled();
      });
    });
  });
});
