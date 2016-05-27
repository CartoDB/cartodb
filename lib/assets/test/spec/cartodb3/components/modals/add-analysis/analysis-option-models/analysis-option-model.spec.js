var AnalysisOptionModel = require('../../../../../../../javascripts/cartodb3/components/modals/add-analysis/analysis-option-models/analysis-option-model');

describe('components/modals/add-analysis/analysis-option-models/analysis-option-model', function () {
  beforeEach(function () {
    this.model = new AnalysisOptionModel({
      title: 'a Buffer',
      desc: 'An example of how buffer would/should behave',
      type_group: 'Specs'
    }, {
      nodeAttrs: {
        type: 'buffer',
        radius: 123
      }
    });
  });

  describe('.acceptsGeometryTypeAsInput', function () {
    it('should return true for valid geometries', function () {
      expect(this.model.acceptsGeometryTypeAsInput('point')).toBe(true);
      expect(this.model.acceptsGeometryTypeAsInput('polygon')).toBe(true);
      expect(this.model.acceptsGeometryTypeAsInput('foo')).toBe(false);
    });
  });

  describe('.getValidInputGeometries', function () {
    it('should return valid input geometries', function () {
      expect(this.model.getValidInputGeometries()).toEqual(jasmine.any(Array));
      expect(this.model.getValidInputGeometries()[0]).toEqual(jasmine.any(String));
    });
  });

  describe('.getFormAttrs', function () {
    it('should return attrs to create a form model for analysis', function () {
      expect(this.model.getFormAttrs('a0', 'point')).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'buffer',
        radius: 123
      });
    });
  });
});
