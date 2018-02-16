var Backbone = require('backbone');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var AnalysisSourceOptionsModel = require('builder/editor/layers/layer-content-views/analyses/analysis-source-options-model');
var FallbackFormModel = require('builder/editor/layers/layer-content-views/analyses/analysis-form-models/fallback-form-model');
var analyses = require('builder/data/analyses');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/fallback-form-model', function () {
  beforeEach(function () {
    this.layerDefinitionModel = new LayerDefinitionModel(null, {
      configModel: {}
    });
    spyOn(this.layerDefinitionModel, 'findAnalysisDefinitionNodeModel');
  });

  describe('when created for a type with a single source', function () {
    beforeEach(function () {
      this.analysisSourceOptionsModel = new AnalysisSourceOptionsModel({fetching: true}, {
        analysisDefinitionNodesCollection: {},
        layerDefinitionsCollection: {},
        tablesCollection: {}
      });

      var attrs = {
        id: 'a2',
        type: 'buffer',
        source: 'a1'
      };

      this.model = new FallbackFormModel(attrs, {
        analyses: analyses,
        configModel: {},
        userActions: {},
        layerDefinitionModel: this.layerDefinitionModel,
        analysisSourceOptionsModel: {}
      });
    });

    describe('should generate schema from camshaft reference', function () {
      beforeEach(function () {
        expect(this.model.schema).toBeDefined();
      });

      it('should have generated form fields', function () {
        expect(Object.keys(this.model.schema).length).toBeGreaterThan(0);
      });

      it('should not allow to change source', function () {
        expect(this.model.schema.source.editorAttrs.disabled).toBe(true);
      });
    });

    describe('for a model representing a type which contains params of type array', function () {
      beforeEach(function () {
        this.model.set({
          type: 'filter-category',
          source: 'a1',
          column: 'col'
        });
      });

      describe('when updated', function () {
        beforeEach(function () {
          this.nodeDefModel = new Backbone.Model();
          expect(this.model.isValid()).toBe(true, 'the model should be valid to be saved');
        });

        it('should split array params for values', function () {
          this.model.set('accept', 'a, b | b, c, d, e, and f');
          this.model.updateNodeDefinition(this.nodeDefModel);

          expect(this.nodeDefModel.get('accept')).toEqual(jasmine.any(Array));
          expect(this.nodeDefModel.get('accept')).toEqual(['a', 'b | b', 'c', 'd', 'e', 'and f']);
        });

        it('should set a null value if there is no value', function () {
          this.model.set('accept', '');
          this.model.updateNodeDefinition(this.nodeDefModel);

          expect(this.nodeDefModel.get('accept')).toBe(null);
        });
      });
    });
  });

  describe('when creatd for a type with multple sources', function () {
    beforeEach(function () {
      this.analysisSourceOptionsModel = new AnalysisSourceOptionsModel({fetching: true}, {
        analysisDefinitionNodesCollection: {},
        layerDefinitionsCollection: {},
        tablesCollection: {}
      });

      var attrs = {
        id: 'b2',
        type: 'aggregate-intersection'
      };

      this.model = new FallbackFormModel(attrs, {
        analyses: analyses,
        configModel: {},
        userActions: {},
        layerDefinitionModel: this.layerDefinitionModel,
        analysisSourceOptionsModel: this.analysisSourceOptionsModel
      });
    });

    describe('when source options is fetched', function () {
      beforeEach(function () {
        spyOn(this.analysisSourceOptionsModel, 'getSelectOptions').and.returnValue([
          {val: 'b1', label: 'b1'},
          {val: 'c2', label: 'c2'}
        ]);

        this.analysisSourceOptionsModel.set('fetching', false);
      });

      it('should update schema', function () {
        expect(this.analysisSourceOptionsModel.getSelectOptions).toHaveBeenCalled();
        expect(this.model.schema).toBeDefined();
      });
    });
  });
});
