import { generateColorStyleProps, resetColorStyleProps } from 'new-dashboard/components/Catalog/map-styles/colorStyles';

describe('colorStyles.js', () => {
  describe('generateColorStyleProps', () => {
    it('returns polygon geography style props', () => {
      const expected = {
        propId: undefined,
        deck: {
          getFillColor: [234, 200, 100, 168],
          getLineColor: [44, 44, 44, 60],
          getLineWidth: 1
        }
      };
      const props = generateColorStyleProps({
        geomType: 'Polygon',
        isGeography: true
      });
      expect(props).toEqual(expected);
    });
    it('returns polygon with numeric variable style props', () => {
      const expected = {
        propId: 'column',
        colorStyle: expect.any(Function),
        deck: {
          getFillColor: expect.any(Function),
          getLineColor: [44, 44, 44, 60],
          getLineWidth: 1
        }
      };
      const props = generateColorStyleProps({
        geomType: 'Polygon',
        variable: {
          type: 'Number',
          attribute: 'column',
          quantiles: [{ '5': [10, 20, 30, 50, 100] }]
        },
        categoryId: 'demographics',
        isGeography: false
      });
      expect(props).toEqual(expected);
    });
    it('returns polygon with string variable style props', () => {
      const expected = {
        propId: 'column',
        colorStyle: expect.any(Function),
        deck: {
          getFillColor: expect.any(Function),
          getLineColor: [44, 44, 44, 60],
          getLineWidth: 1
        }
      };
      const props = generateColorStyleProps({
        geomType: 'Polygon',
        variable: {
          type: 'String',
          attribute: 'column',
          categories: [{ category: 'a' }]
        },
        categoryId: 'demographics',
        isGeography: false
      });
      expect(props).toEqual(expected);
    });
    it('returns line geography style props', () => {
      const expected = {
        propId: undefined,
        deck: {
          getLineColor: [234, 200, 100, 255],
          getLineWidth: 2
        }
      };
      const props = generateColorStyleProps({
        geomType: 'LineString',
        isGeography: true
      });
      expect(props).toEqual(expected);
    });
    it('returns line with numeric variable style props', () => {
      const expected = {
        propId: 'column',
        colorStyle: expect.any(Function),
        deck: {
          getLineColor: expect.any(Function),
          getLineWidth: 2
        }
      };
      const props = generateColorStyleProps({
        geomType: 'LineString',
        variable: {
          type: 'Number',
          attribute: 'column',
          quantiles: [{ '5': [10, 20, 30, 50, 100] }]
        },
        categoryId: 'demographics',
        isGeography: false
      });
      expect(props).toEqual(expected);
    });
    it('returns line with string variable style props', () => {
      const expected = {
        propId: 'column',
        colorStyle: expect.any(Function),
        deck: {
          getLineColor: expect.any(Function),
          getLineWidth: 2
        }
      };
      const props = generateColorStyleProps({
        geomType: 'LineString',
        variable: {
          type: 'String',
          attribute: 'column',
          categories: [{ category: 'a' }]
        },
        categoryId: 'demographics',
        isGeography: false
      });
      expect(props).toEqual(expected);
    });
    it('returns point geography style props', () => {
      const expected = {
        propId: undefined,
        deck: {
          getFillColor: [234, 200, 100, 255],
          getLineColor: [44, 44, 44, 255],
          getLineWidth: 1,
          getRadius: 4
        }
      };
      const props = generateColorStyleProps({
        geomType: 'Point',
        isGeography: true
      });
      expect(props).toEqual(expected);
    });
    it('returns point with numeric variable style props', () => {
      const expected = {
        propId: 'column',
        colorStyle: expect.any(Function),
        deck: {
          getFillColor: expect.any(Function),
          getLineColor: [100, 100, 100, 255],
          getLineWidth: 1,
          getRadius: 4
        }
      };
      const props = generateColorStyleProps({
        geomType: 'Point',
        variable: {
          type: 'Number',
          attribute: 'column',
          quantiles: [{ '5': [10, 20, 30, 50, 100] }]
        },
        categoryId: 'demographics',
        isGeography: false
      });
      expect(props).toEqual(expected);
    });
    it('returns point with string variable style props', () => {
      const expected = {
        propId: 'column',
        colorStyle: expect.any(Function),
        deck: {
          getFillColor: expect.any(Function),
          getLineColor: [100, 100, 100, 255],
          getLineWidth: 1,
          getRadius: 4
        }
      };
      const props = generateColorStyleProps({
        geomType: 'Point',
        variable: {
          type: 'String',
          attribute: 'column',
          categories: [{ category: 'a' }]
        },
        categoryId: 'demographics',
        isGeography: false
      });
      expect(props).toEqual(expected);
    });
  });
  describe('resetColorStyleProps', () => {
    it('returns undefined style props', () => {
      const expected = {
        propId: undefined,
        colorStyle: undefined,
        deck: {
          getFillColor: undefined,
          getLineColor: undefined,
          getLineWidth: undefined,
          getRadius: undefined
        }
      };
      const props = resetColorStyleProps();
      expect(props).toEqual(expected);
    });
  });
});
