var Backbone = require('backbone');
var AnalysisOptionModel = require('builder/components/modals/add-analysis/analysis-option-models/analysis-option-model');
var SQLFunctionOptionModel = require('builder/components/modals/add-analysis/analysis-option-models/deprecated-sql-function-option-model');

describe('deprecated-sql-function-option-model', function () {
  var model;

  beforeEach(function () {
    spyOn(AnalysisOptionModel.prototype, 'getFormAttrs').and.returnValue({
      source: 'y0' // Return always this `source` property. We need to check that it gets deleted.
    });
    model = new SQLFunctionOptionModel(null, {
      nodeAttrs: {
        key: 'value'
      }
    });
  });

  describe('getFormAttrs', function () {
    it('should get form attributes, delete source and set primary_source with the layer definition attributes', function () {
      var fakeLayerDefModel = new Backbone.Model({
        source: 'z0'
      });

      var formAttrs = model.getFormAttrs(fakeLayerDefModel);

      expect(AnalysisOptionModel.prototype.getFormAttrs).toHaveBeenCalledWith(fakeLayerDefModel);
      expect(formAttrs).toEqual({ primary_source: 'z0' });
    });
  });
});
