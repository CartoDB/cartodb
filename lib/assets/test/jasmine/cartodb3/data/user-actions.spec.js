var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
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
            letter: 'A',
            source: 'a0'
          }
        },
        {
          id: 'B',
          kind: 'carto',
          options: {
            letter: 'B',
            source: 'b2'
          }
        }, {
          id: 'C',
          kind: 'carto',
          options: {
            letter: 'C',
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
          expect(this.analysisDefinitionNodesCollection.pluck('id')).toEqual(['a0', 'c0', 'orphan']);
        });

        it('should delete dependent analysis', function () {
          expect(this.analysisDefinitionsCollection.pluck('node_id')).toEqual(['a0']);
        });

        it('should delete dependent layers', function () {
          expect(this.layerDefinitionsCollection.pluck('source')).toEqual(['a0']);
        });

        it('should delete dependent widgets', function () {
          expect(this.widgetDefinitionsCollection.pluck('source')).toEqual(['c1']);
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
        this.c1Analysis = this.analysisDefinitionsCollection.findByNodeId('c1');

        spyOn(this.c1, 'destroy').and.callThrough();
        spyOn(this.C, 'save').and.callThrough();
        spyOn(this.c1Analysis, 'save').and.callThrough();

        this.userActions.deleteAnalysisNode('c1');
      });

      it('should delete dependent nodes', function () {
        expect(this.analysisDefinitionNodesCollection.pluck('id')).not.toContain('c1');
        expect(this.analysisDefinitionNodesCollection.length).toEqual(6);
      });

      it('should update existing analysis', function () {
        expect(this.c1Analysis.save).toHaveBeenCalled();
        expect(this.c1Analysis.get('node_id')).toEqual('c0');
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
        expect(this.analysisDefinitionNodesCollection.pluck('id')).not.toContain('b2');
        expect(this.analysisDefinitionNodesCollection.pluck('id')).not.toContain('c1');
        expect(this.analysisDefinitionNodesCollection.length).toEqual(5);
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
        expect(this.widgetDefinitionsCollection.pluck('source')).toEqual(['b0', 'c1']);
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
        expect(this.analysisDefinitionNodesCollection.pluck('id')).not.toContain('b2');
        expect(this.analysisDefinitionNodesCollection.pluck('id')).not.toContain('b1');
        expect(this.analysisDefinitionNodesCollection.pluck('id')).not.toContain('c1');
        expect(this.analysisDefinitionNodesCollection.length).toEqual(4);
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
        expect(this.widgetDefinitionsCollection.pluck('source')).toEqual(['b0', 'c1']);
      });

      it('should delete node', function () {
        expect(this.b1.destroy).toHaveBeenCalled();
      });
    });
  });
});
