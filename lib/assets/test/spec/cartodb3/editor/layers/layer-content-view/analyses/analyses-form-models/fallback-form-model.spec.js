var LayerDefinitionModel = require('../../../../../../../../javascripts/cartodb3/data/layer-definition-model');
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

    this.model = new FallbackFormModel(this.attrs, {
      layerDefinitionModel: this.layerDefinitionModel,
      analysisSourceOptionsModel: {}
    });
  });

  it('should generate schema from camshaft reference', function () {
    expect(this.model.schema).toBeDefined();
    expect(Object.keys(this.model.schema).length).toBeGreaterThan(0);
  });
});
