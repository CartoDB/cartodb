var layerColors = require('builder/data/layer-colors');

describe('data/layer-colors', function () {
  describe('.getColorForLetter', function () {
    it('should return the first color if no letter is given', function () {
      expect(layerColors.getColorForLetter()).toEqual(layerColors.COLORS[0]);
    });

    it('should return the color for the given letter', function () {
      expect(layerColors.getColorForLetter('a')).toEqual(layerColors.COLORS[0]);
      expect(layerColors.getColorForLetter('b')).toEqual(layerColors.COLORS[1]);
      expect(layerColors.getColorForLetter('c')).toEqual(layerColors.COLORS[2]);
      expect(layerColors.getColorForLetter('d')).toEqual(layerColors.COLORS[3]);
      expect(layerColors.getColorForLetter('e')).toEqual(layerColors.COLORS[4]);
      expect(layerColors.getColorForLetter('f')).toEqual(layerColors.COLORS[5]);
      expect(layerColors.getColorForLetter('g')).toEqual(layerColors.COLORS[6]);
      expect(layerColors.getColorForLetter('h')).toEqual(layerColors.COLORS[7]);
      expect(layerColors.getColorForLetter('i')).toEqual(layerColors.COLORS[8]);
      expect(layerColors.getColorForLetter('j')).toEqual(layerColors.COLORS[9]);
      expect(layerColors.getColorForLetter('k')).toEqual(layerColors.COLORS[0]);
      expect(layerColors.getColorForLetter('l')).toEqual(layerColors.COLORS[1]);
      expect(layerColors.getColorForLetter('m')).toEqual(layerColors.COLORS[2]);
      expect(layerColors.getColorForLetter('n')).toEqual(layerColors.COLORS[3]);
      expect(layerColors.getColorForLetter('o')).toEqual(layerColors.COLORS[4]);
      expect(layerColors.getColorForLetter('p')).toEqual(layerColors.COLORS[5]);
      expect(layerColors.getColorForLetter('q')).toEqual(layerColors.COLORS[6]);
      expect(layerColors.getColorForLetter('r')).toEqual(layerColors.COLORS[7]);
      expect(layerColors.getColorForLetter('s')).toEqual(layerColors.COLORS[8]);
      expect(layerColors.getColorForLetter('t')).toEqual(layerColors.COLORS[9]);
      expect(layerColors.getColorForLetter('u')).toEqual(layerColors.COLORS[0]);
      expect(layerColors.getColorForLetter('v')).toEqual(layerColors.COLORS[1]);
      expect(layerColors.getColorForLetter('w')).toEqual(layerColors.COLORS[2]);
      expect(layerColors.getColorForLetter('x')).toEqual(layerColors.COLORS[3]);
      expect(layerColors.getColorForLetter('y')).toEqual(layerColors.COLORS[4]);
      expect(layerColors.getColorForLetter('z')).toEqual(layerColors.COLORS[5]);
    });
  });
});
