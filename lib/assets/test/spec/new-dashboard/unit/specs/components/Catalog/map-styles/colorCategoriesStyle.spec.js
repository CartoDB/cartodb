import colorCategoriesStyle from 'new-dashboard/components/Catalog/map-styles/colorCategoriesStyle';

describe('colorCategoriesStyle.js', () => {
  describe('colorCategoriesStyle', () => {
    it('compute color categories style', () => {
      const stats = {
        categories: [
          { category: 'a' },
          { category: 'b' },
          { category: 'c' },
          { category: 'd' },
          { category: 'e' }
        ]
      };
      const colorStyle = colorCategoriesStyle({
        categories: { stats, top: 3 },
        colors: 'Prism'
      });
      expect(colorStyle('a')).toEqual([95, 70, 144, 255]);
      expect(colorStyle('b')).toEqual([29, 105, 150, 255]);
      expect(colorStyle('c')).toEqual([56, 166, 165, 255]);
      expect(colorStyle('d')).toEqual([165, 170, 153]);
      expect(colorStyle('e')).toEqual([165, 170, 153]);
    });
  });
});
