var _ = require('underscore');
var layerColors = require('../../../../javascripts/cartodb3/data/layer-colors');

describe('data/layer-colors', function () {
  describe('.next', function () {
    it('should return the first color when no colors are given', function () {
      expect(layerColors.next([])).toEqual(layerColors.COLORS[0]);
    });

    it('should return the first available color when some background colors are given', function () {
      var usedColors = [
        layerColors.COLORS[0],
        layerColors.COLORS[1]
      ];
      expect(layerColors.next(usedColors)).toEqual(layerColors.COLORS[2]);

      usedColors = [
        layerColors.COLORS[1],
        layerColors.COLORS[2]
      ];
      expect(layerColors.next(usedColors)).toEqual(layerColors.COLORS[0]);
    });

    it('should return the first color again when all colors are in use', function () {
      var usedColors = _.pluck(layerColors, 'background');
      expect(layerColors.next(usedColors)).toEqual(layerColors.COLORS[0]);
    });

    it('should return the first available color when all colors are in use and some colors have been used more than once', function () {
      var usedColors = _.pluck(layerColors, 'background');
      usedColors = usedColors.concat(layerColors.COLORS[0], layerColors.COLORS[1]);
      expect(layerColors.next(usedColors)).toEqual(layerColors.COLORS[2]);
    });
  });
});
