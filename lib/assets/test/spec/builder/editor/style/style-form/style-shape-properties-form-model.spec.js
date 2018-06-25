var StyleShapePropertiesFormModel = require('builder/editor/style/style-form/style-properties-form/style-shape-properties-form-model');
var StyleConstants = require('builder/components/form-components/_constants/_style');
var StyleModel = require('builder/editor/style/style-definition-model.js');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');

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

    it('should parse size & color props separately and not original fill & stroke', function () {
      var attrs = StyleShapePropertiesFormModel.prototype.parse(
        this.generateData(StyleConstants.Type.SIMPLE, 'point')
      );

      expect(attrs.fillSize).toBeDefined();
      expect(attrs.fillColor).toBeDefined();
      expect(attrs.fill).not.toBeDefined();

      expect(attrs.strokeSize).toBeDefined();
      expect(attrs.strokeColor).toBeDefined();
      expect(attrs.stroke).not.toBeDefined();
    });

    it('should not provide fill size if geometry type is polygon or style aggregated', function () {
      var attrs = StyleShapePropertiesFormModel.prototype.parse(
        this.generateData(StyleConstants.Type.SQUARES, 'point')
      );

      expect(attrs.fillSize).not.toBeDefined();

      attrs = StyleShapePropertiesFormModel.prototype.parse(
        this.generateData(StyleConstants.Type.SIMPLE, 'polygon')
      );
      expect(attrs.fillSize).not.toBeDefined();

      attrs = StyleShapePropertiesFormModel.prototype.parse(
        this.generateData(StyleConstants.Type.SIMPLE, 'point')
      );
      expect(attrs.fillSize).toBeDefined();
    });

    it('should not provide fill if geometry type is line', function () {
      var attrs = StyleShapePropertiesFormModel.prototype.parse(
        this.generateData('simple', 'polygon')
      );
      expect(attrs.fillSize).not.toBeDefined();
      expect(attrs.fillColor).toBeDefined();

      attrs = StyleShapePropertiesFormModel.prototype.parse(
        this.generateData('simple', 'line')
      );

      expect(attrs.fillSize).not.toBeDefined();
      expect(attrs.fillColor).not.toBeDefined();
      expect(attrs.strokeColor).toBeDefined();
      expect(attrs.blending).toBeDefined();
    });

    it('should not provide stroke and blending if type is heatmap', function () {
      var attrs = StyleShapePropertiesFormModel.prototype.parse(
        this.generateData('heatmap', 'point')
      );
      expect(attrs.stroke).not.toBeDefined();
      expect(attrs.blending).not.toBeDefined();
      expect(attrs.fillSize).toBeDefined();
      expect(attrs.fillColor).toBeDefined();
    });
  });

  describe('_getUpdatedPartialProperties', function () {
    beforeEach(function () {
      this.styleModel = new StyleModel({
        style: StyleConstants.Type.SIMPLE,
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
        }
      });

      this.model = new StyleShapePropertiesFormModel(null, {
        styleModel: this.styleModel,
        modals: {}
      });
      spyOn(MetricsTracker, 'track');
    });

    it('should onChange get updated properties', function () {
      spyOn(this.model, '_getUpdatedPartialProperties').and.callThrough();

      this.model._onChange();
      expect(this.model._getUpdatedPartialProperties).toHaveBeenCalled();
    });

    it('should get updated properties in original fill & stroke models', function () {
      // individual sets...
      this.model.set('fillSize', {
        fixed: 20
      });
      this.model.set('fillColor', {
        fixed: 'blue'
      });

      this.model.set('strokeSize', {
        fixed: 30
      });
      this.model.set('strokeColor', {
        fixed: 'black'
      });

      // ...are transferred to original fill & stroke models
      var updatedProps = this.model._getUpdatedPartialProperties();

      expect(updatedProps['fill']['size']).toEqual({fixed: 20});
      expect(updatedProps['fill']['color']).toEqual({fixed: 'blue'});
      expect(updatedProps['stroke']['size']).toEqual({fixed: 30});
      expect(updatedProps['stroke']['color']).toEqual({fixed: 'black'});
    });
  });
});
