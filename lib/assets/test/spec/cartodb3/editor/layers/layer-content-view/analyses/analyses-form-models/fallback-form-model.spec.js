var LayerDefinitionModel = require('../../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisSourceOptionsModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-source-options-model');
var FallbackFormModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/fallback-form-model');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/fallback-form-model', function () {
  beforeEach(function () {
    this.layerDefinitionModel = new LayerDefinitionModel(null, {
      configModel: {}
    });
    spyOn(this.layerDefinitionModel, 'findAnalysisDefinitionNodeModel');
    spyOn(this.layerDefinitionModel, 'createNewAnalysisNode');
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
          column: 'col',
          accept: 'a || b | b || c || d, e, and f'
        });
      });

      describe('when saved', function () {
        beforeEach(function () {
          expect(this.model.isValid()).toBe(true, 'the model should be valid to be saved');
          this.model.save();
        });

        it('should split array params', function () {
          expect(this.layerDefinitionModel.createNewAnalysisNode).toHaveBeenCalled();

          var attrs = this.layerDefinitionModel.createNewAnalysisNode.calls.argsFor(0)[0];
          expect(attrs.accept).toEqual(jasmine.any(Array));
          expect(attrs.accept).toEqual(['a', 'b | b', 'c', 'd, e, and f']);
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
