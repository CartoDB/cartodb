var StyleShapePropertiesFormModel = require('builder/editor/style/style-form/style-properties-form/style-shape-properties-form-model');

describe('editor/style/style-form/style-shape-properties-form-model', function () {
  describe('.parse', function () {
    beforeEach(function () {
      this.generateData = function (styleType, geometryType) {
        return {
          type: styleType,
          geom: geometryType,
          fill: {
            size: {
              fixed: 10
            },
            color: {
              fixed: 'red'
            }
          },
          stroke: {
            size: {
              fixed: 10
            },
            color: {
              fixed: 'white'
            }
          },
          blending: 'none'
        };
      };
    });

    it('should not provide fill size if geometry type is polygon or style aggregated', function () {
      var attrs = StyleShapePropertiesFormModel.prototype.parse(
        this.generateData('squares', 'point')
      );
      expect(attrs.fill.size).not.toBeDefined();

      attrs = StyleShapePropertiesFormModel.prototype.parse(
        this.generateData('simple', 'polygon')
      );
      expect(attrs.fill.size).not.toBeDefined();

      attrs = StyleShapePropertiesFormModel.prototype.parse(
        this.generateData('simple', 'point')
      );
      expect(attrs.fill.size).toBeDefined();
    });

    it('should not provide fill if geometry type is line', function () {
      var attrs = StyleShapePropertiesFormModel.prototype.parse(
        this.generateData('simple', 'polygon')
      );
      expect(attrs.fill).toBeDefined();

      attrs = StyleShapePropertiesFormModel.prototype.parse(
        this.generateData('simple', 'line')
      );
      expect(attrs.fill).not.toBeDefined();
      expect(attrs.stroke).toBeDefined();
      expect(attrs.blending).toBeDefined();
    });

    it('should not provide stroke and blending if type is heatmap', function () {
      var attrs = StyleShapePropertiesFormModel.prototype.parse(
        this.generateData('heatmap', 'point')
      );
      expect(attrs.stroke).not.toBeDefined();
      expect(attrs.blending).not.toBeDefined();
      expect(attrs.fill).toBeDefined();
    });
  });
});
