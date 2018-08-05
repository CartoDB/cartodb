var _ = require('underscore');

var LegendColorTypes = require('builder/editor/layers/layer-content-views/legend/color/legend-color-types');
var LegendTypes = require('builder/editor/layers/layer-content-views/legend/legend-types');

var StyleConstants = require('builder/components/form-components/_constants/_style');
var StyleModel = require('builder/editor/style/style-definition-model');

describe('editor/layers/layer-content-view/legend/color/legend-color-types', function () {
  function getLegendType (type) {
    return _.find(LegendColorTypes, function (legendColorType) {
      return legendColorType.value === type;
    }, this);
  }

  var anStyleFillByBooleanAttribute = new StyleModel({
    type: StyleConstants.Type.SIMPLE,
    fill: {
      color: {
        attribute: 'a_boolean_field',
        attribute_type: 'boolean',
        range: ['#2bd900', '#d96b6b', '#e7e7e7'],
        quantification: undefined
      }
    },
    stroke: {
      color: {
        fixed: 'white'
      }
    }
  });

  describe('.category legend', function () {
    beforeEach(function () {
      this.legendType = getLegendType(LegendTypes.CATEGORY);
    });

    it('should be compatible with a boolean attribute in a color by value viz', function () {
      expect(this.legendType.isStyleCompatible(anStyleFillByBooleanAttribute)).toBe(true);
    });
  });

  describe('.choropleth legend', function () {
    beforeEach(function () {
      this.legendType = getLegendType(LegendTypes.CHOROPLETH);
    });

    it('should be incompatible with a boolean attribute in a color by value viz', function () {
      expect(this.legendType.isStyleCompatible(anStyleFillByBooleanAttribute)).toBe(false);
    });
  });
});
