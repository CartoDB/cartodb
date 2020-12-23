import colorBinsStyle from 'new-dashboard/components/Catalog/map-styles/colorBinsStyle';

describe('colorBinsStyle.js', () => {
  describe('colorBinsStyle', () => {
    it('compute color bins style', () => {
      const stats = {
        quantiles: [{ '5': [10, 20, 30, 50, 100] }]
      };
      const colorStyle = colorBinsStyle({
        breaks: { stats, method: 'quantiles', bins: 5 },
        colors: 'BrwnYl'
      });
      expect(colorStyle(0)).toEqual([237, 229, 207, 255]);
      expect(colorStyle(1)).toEqual([237, 229, 207, 255]);
      expect(colorStyle(10)).toEqual([237, 229, 207, 255]);
      expect(colorStyle(20)).toEqual([221, 186, 155, 255]);
      expect(colorStyle(30)).toEqual([205, 140, 122, 255]);
      expect(colorStyle(50)).toEqual([178, 97, 102, 255]);
      expect(colorStyle(100)).toEqual([138, 60, 86, 255]);
      expect(colorStyle(200)).toEqual([84, 31, 63, 255]);
    });
  });
});
