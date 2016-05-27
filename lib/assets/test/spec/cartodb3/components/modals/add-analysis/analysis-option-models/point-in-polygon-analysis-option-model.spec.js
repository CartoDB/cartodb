var PointInPolygonAnalysisOptionModel = require('../../../../../../../javascripts/cartodb3/components/modals/add-analysis/analysis-option-models/point-in-polygon-analysis-option-model');

describe('components/modals/add-analysis/analysis-option-models/point-in-polygon-analysis-option-model', function () {
  beforeEach(function () {
    this.model = new PointInPolygonAnalysisOptionModel({
    }, {
      nodeAttrs: {
        type: 'point-in-polygon'
      }
    });
  });

  describe('.getFormAttrs', function () {
    describe('when given a points source', function () {
      beforeEach(function () {
        this.attrs = this.model.getFormAttrs('a0', 'point');
      });

      it('should return attrs with points as primary source', function () {
        expect(this.attrs).toEqual({
          id: 'a1',
          type: 'point-in-polygon',
          primary_source_name: 'points_source',
          points_source: 'a0'
        });
      });
    });

    describe('when given a polygons source', function () {
      beforeEach(function () {
        this.attrs = this.model.getFormAttrs('a0', 'polygon');
      });

      it('should return attrs with polygons as primary source', function () {
        expect(this.attrs).toEqual({
          id: 'a1',
          type: 'point-in-polygon',
          primary_source_name: 'polygons_source',
          polygons_source: 'a0'
        });
      });
    });

    it('should not accept non-compatible geometry', function () {
      var m = this.model;
      expect(function () { m.getFormAttrs('a0', 'line'); }).toThrowError(/invalid geometry/);
    });
  });
});
