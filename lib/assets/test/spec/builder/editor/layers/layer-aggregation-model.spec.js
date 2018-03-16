var _ = require('underscore');
var LayerAggregationModel = require('builder/editor/layers/layer-aggregation-model');

describe('editor/layers/layer-aggregation-model', function () {
  var model;

  var createModelFn = function (options) {
    var defaultOptions = {};

    model = new LayerAggregationModel({}, _.extend(options, defaultOptions));

    return model;
  };

  describe('creation', function () {
    beforeEach(function () {
      model = createModelFn();
    });

    it('should be initialize default values', function () {
      expect(model.get('threshold')).toBeDefined();
      expect(model.get('resolution')).toBeDefined();
      expect(model.get('placement')).toBeDefined();
    });
  });
});
