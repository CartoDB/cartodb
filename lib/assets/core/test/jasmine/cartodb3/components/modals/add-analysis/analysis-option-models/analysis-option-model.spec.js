var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisOptionModel = require('../../../../../../../javascripts/cartodb3/components/modals/add-analysis/analysis-option-models/analysis-option-model');

describe('cartodb3/components/modals/add-analysis/analysis-option-models/analysis-option-model', function () {
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
      expect(this.model.acceptsGeometryTypeAsInput('line')).toBe(true);

      var model = new AnalysisOptionModel(null, {nodeAttrs: {type: 'trade-area'}});
      expect(model.acceptsGeometryTypeAsInput('point')).toBe(true);
      expect(model.acceptsGeometryTypeAsInput('polygon')).toBe(false);
    });
  });

  describe('.getValidInputGeometries', function () {
    it('should return valid input geometries', function () {
      expect(this.model.getValidInputGeometries()).toEqual(jasmine.any(Array));
      expect(this.model.getValidInputGeometries()[0]).toEqual(jasmine.any(String));
    });
  });

  describe('.getFormAttrs', function () {
    beforeEach(function () {
      this.layerDefModel = new LayerDefinitionModel({
        id: 'layerA',
        type: 'cartoDB',
        letter: 'a',
        source: 'a0'
      }, {
        configModel: {}
      });
    });

    describe('when given a layer with own source', function () {
      it('should return attrs to create a form model for analysis', function () {
        expect(this.model.getFormAttrs(this.layerDefModel)).toEqual({
          id: 'a1',
          source: 'a0',
          type: 'buffer',
          radius: 123
        });
      });
    });

    describe('when given a layer which source belongs to another layer', function () {
      beforeEach(function () {
        this.layerDefModel.set('source', 'b0');
      });

      it('should return attrs to create a form model for analysis', function () {
        var attrs = this.model.getFormAttrs(this.layerDefModel);
        expect(attrs.id).toEqual('a1', 'id should be adapted for layer, not continue on source node');
        expect(attrs).toEqual({
          id: 'a1',
          source: 'b0',
          type: 'buffer',
          radius: 123
        });
      });
    });
  });
});
