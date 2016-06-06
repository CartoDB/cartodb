var LayerDefinitionModel = require('../../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisSourceOptionsModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-source-options-model');
var FallbackFormModel = require('../../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses/analysis-form-models/fallback-form-model');

describe('editor/layers/layer-content-views/analyses/analysis-form-models/fallback-form-model', function () {
  beforeEach(function () {
    this.layerDefinitionModel = new LayerDefinitionModel(null, {
      configModel: {}
    });
    spyOn(this.layerDefinitionModel, 'createNewAnalysisNode');

    this.attrs = {
      type: 'buffer'
    };

    this.analysisSourceOptionsModel = new AnalysisSourceOptionsModel({fetching: true}, {
      analysisDefinitionNodesCollection: {},
      layerDefinitionsCollection: {},
      tablesCollection: {}
    });

    this.model = new FallbackFormModel(this.attrs, {
      layerDefinitionModel: this.layerDefinitionModel,
      analysisSourceOptionsModel: this.analysisSourceOptionsModel
    });
  });

  it('should generate schema from camshaft reference', function () {
    expect(this.model.schema).toBeDefined();
    expect(Object.keys(this.model.schema).length).toBeGreaterThan(0);
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
