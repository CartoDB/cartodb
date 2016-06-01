var _ = require('underscore');
var camshaftReference = require('../../../../javascripts/cartodb3/data/camshaft-reference');

describe('data/camshaft-reference', function () {
  describe('.getSourceNamesForAnalysisType', function () {
    it('should return the source names for a given analyses type', function () {
      expect(camshaftReference.getSourceNamesForAnalysisType('source')).toEqual([]);
      expect(camshaftReference.getSourceNamesForAnalysisType('point-in-polygon')).toEqual(['points_source', 'polygons_source']);
      expect(camshaftReference.getSourceNamesForAnalysisType('trade-area')).toEqual(['source']);
    });
  });

  describe('.paramsForType', function () {
    it('should return the params for given type', function () {
      expect(camshaftReference.paramsForType('buffer')).toEqual({
        source: jasmine.any(Object),
        radius: jasmine.any(Object),
        isolines: jasmine.any(Object),
        dissolved: jasmine.any(Object)
      });
    });

    it('should throw error if there is no params for given type', function () {
      expect(function () { camshaftReference.paramsForType('foobar'); }).toThrowError(/type: foobar/);
      expect(function () { camshaftReference.paramsForType(); }).toThrowError(/type: undefined/);
    });
  });

  describe('.parse', function () {
    beforeEach(function () {
      this.validFormAttrs = {
        id: 'a1',
        source: ' a0 ',
        type: 'buffer',
        radius: '100',
        isolines: '2',
        dissolved: 'false'
      };
    });

    it('should return empty source', function () {
      expect(camshaftReference.parse(_.omit(this.validFormAttrs, 'source'))).toEqual({
        id: 'a1',
        source: '',
        type: 'buffer',
        radius: 100,
        isolines: 2,
        dissolved: false
      });
    });

    it('should parse given form attrs string values to the want types', function () {
      expect(camshaftReference.parse(this.validFormAttrs)).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'buffer',
        radius: 100,
        isolines: 2,
        dissolved: false
      });
    });

    it('should not require any absent optional values', function () {
      expect(camshaftReference.parse(_.omit(this.validFormAttrs, 'isolines', 'dissolved'))).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'buffer',
        radius: 100
      });
    });

    it('should return normalized values for invalid types', function () {
      expect(camshaftReference.parse({
        id: 'a1',
        source: null,
        type: 'buffer',
        radius: {},
        isolines: {},
        dissolved: 'nope'
      })).toEqual({
        id: 'a1',
        source: '',
        type: 'buffer',
        radius: NaN,
        isolines: NaN,
        dissolved: false
      });
    });

    it('should trim string values', function () {
      var validFormAttrs = {
        id: 'a1',
        source: 'a0',
        type: 'population-in-area',
        final_column: ' col '
      };
      expect(camshaftReference.parse(validFormAttrs)).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'population-in-area',
        final_column: 'col'
      });

      expect(camshaftReference.parse(_.omit(validFormAttrs, 'final_column'))).toEqual({
        id: 'a1',
        source: 'a0',
        type: 'population-in-area',
        final_column: null
      });
    });

    it('should check enum valid', function () {
      var validFormAttrs = {
        id: 'a1',
        type: 'aggregate-intersection',
        source: 'a0',
        target: 'b1',
        aggregate_function: 'count',
        aggregate_column: 'col'
      };
      expect(camshaftReference.parse(validFormAttrs)).toEqual({
        id: 'a1',
        type: 'aggregate-intersection',
        source: 'a0',
        target: 'b1',
        aggregate_function: 'count',
        aggregate_column: 'col'
      });

      expect(camshaftReference.parse(_.omit(validFormAttrs, 'aggregate_function'))).toEqual({
        id: 'a1',
        type: 'aggregate-intersection',
        source: 'a0',
        target: 'b1',
        aggregate_function: null,
        aggregate_column: 'col'
      });
    });
  });

  describe('.validate', function () {
    describe('when given a type', function () {
      describe('with sources', function () {
        beforeEach(function () {
          this.validFormAttrs = {
            id: 'a1',
            type: 'point-in-polygon',
            points_source: 'a0',
            polygons_source: 'b1'
          };
        });

        it('should return nothing for valid values', function () {
          expect(camshaftReference.validate(this.validFormAttrs)).toBeUndefined();
        });

        it('should return error for missing a source', function () {
          expect(camshaftReference.validate(_.omit(this.validFormAttrs, 'polygons_source'))).toEqual({polygons_source: jasmine.any(String)});
          expect(camshaftReference.validate(_.omit(this.validFormAttrs, 'points_source'))).toEqual({points_source: jasmine.any(String)});
        });
      });

      describe('with numbers', function () {
        beforeEach(function () {
          this.validFormAttrs = {
            id: 'a1',
            source: 'a0',
            type: 'buffer',
            radius: '1'
          };
        });

        it('should return nothing for valid values', function () {
          expect(camshaftReference.validate(this.validFormAttrs)).toBeUndefined();
        });

        it('should return errors if missing required param', function () {
          expect(camshaftReference.validate(_.omit(this.validFormAttrs, 'radius'))).toEqual({
            radius: jasmine.any(String)
          });
        });
      });

      describe('with enums', function () {
        beforeEach(function () {
          this.validFormAttrs = {
            id: 'a1',
            type: 'aggregate-intersection',
            source: 'a0',
            target: 'b1',
            aggregate_function: 'count',
            aggregate_column: 'col'
          };
        });

        it('should return nothing for valid values', function () {
          expect(camshaftReference.validate(this.validFormAttrs)).toBeUndefined();
        });

        it('should return error if enum is missing', function () {
          expect(camshaftReference.validate(_.omit(this.validFormAttrs, 'aggregate_function'))).toEqual({
            aggregate_function: jasmine.any(String)
          });
        });

        it('should return error if enum is invalid', function () {
          this.validFormAttrs.aggregate_function = 'FOOBAR';
          expect(camshaftReference.validate(this.validFormAttrs)).toEqual({
            aggregate_function: jasmine.any(String)
          });
        });
      });
    });
  });

  describe('.isValidInputGeometryForType', function () {
    it('should return true if it is', function () {
      expect(camshaftReference.isValidInputGeometryForType('point', 'buffer')).toBe(true);
      expect(camshaftReference.isValidInputGeometryForType('polygon', 'buffer')).toBe(true);
      expect(camshaftReference.isValidInputGeometryForType('line', 'buffer')).toBe(true);

      expect(camshaftReference.isValidInputGeometryForType('point', 'point-in-polygon')).toBe(true);
      expect(camshaftReference.isValidInputGeometryForType('polygon', 'point-in-polygon')).toBe(true);
      expect(camshaftReference.isValidInputGeometryForType('line', 'point-in-polygon')).toBe(false);
    });

    it('should throw an error if type is not valid', function () {
      expect(function () { camshaftReference.isValidInputGeometryForType('point', 'foobar'); }).toThrowError(/ foobar/);
    });
  });

  describe('.getValidInputGeometriesForType', function () {
    it('should return the geometries for given type and source name', function () {
      expect(camshaftReference.getValidInputGeometriesForType('buffer')).toEqual(['*']);
      expect(camshaftReference.getValidInputGeometriesForType('point-in-polygon')).toEqual(['point', 'polygon']);
      expect(camshaftReference.getValidInputGeometriesForType('trade-area')).toEqual(['point']);
    });

    it('should throw an error if type is not valid', function () {
      expect(function () { camshaftReference.getValidInputGeometriesForType('foobar'); }).toThrowError(/ foobar/);
      expect(function () { camshaftReference.getValidInputGeometriesForType(); }).toThrowError(/ undefined/);
      expect(function () { camshaftReference.getValidInputGeometriesForType(null); }).toThrowError(/ null/);
    });
  });
});
