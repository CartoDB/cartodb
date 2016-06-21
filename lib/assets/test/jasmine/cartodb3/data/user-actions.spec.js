var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AnalysisDefinitionsCollection = require('../../../../javascripts/cartodb3/data/analysis-definitions-collection');
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
    this.widgetDefinitionsCollection = {};

    this.userActions = UserActions({
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      analysisDefinitionsCollection: this.analysisDefinitionsCollection,
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

        it('should delegate back to form model to update the node-definition as it sees fit', function () {
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
});
