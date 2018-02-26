var DistanceConverter = require('builder/value-objects/distance-converter');

describe('value-objects/distance-converter', function () {
  it('should have a set of static distance options', function () {
    expect(DistanceConverter.OPTIONS).toBeDefined();
  });

  describe('.toMeters', function () {
    it('should return the corresponding meters to the given val and distance', function () {
      expect(DistanceConverter.toMeters(3, 'kilometers')).toEqual(3000);
      expect(DistanceConverter.toMeters('3', 'kilometers')).toEqual(3000);

      expect(parseInt(DistanceConverter.toMeters(3, 'miles'), 10)).toEqual(4828);
      expect(parseInt(DistanceConverter.toMeters('3', 'miles'), 10)).toEqual(4828);

      expect(DistanceConverter.toMeters(3, 'meters')).toEqual(3);
      expect(DistanceConverter.toMeters('3', 'meters')).toEqual(3);

      expect(DistanceConverter.toMeters(0, 'meters')).toEqual(0);
    });

    it('should throw error if val is invalid', function () {
      expect(function () { DistanceConverter.toMeters(null, 'meters'); }).toThrowError(/required.*number/);
      expect(function () { DistanceConverter.toMeters('', 'meters'); }).toThrowError(/required.*number/);
      expect(function () { DistanceConverter.toMeters('WAT', 'meters'); }).toThrowError(/required.*number/);
    });

    it('should throw error if distance is invalid', function () {
      expect(function () { DistanceConverter.toMeters(3, 'lightyears'); }).toThrowError(/meters, /);
    });
  });

  describe('.toDistance', function () {
    it('should return the corresponding meters to the given val and distance', function () {
      expect(DistanceConverter.toDistance(3000, 'kilometers')).toEqual(3);
      expect(DistanceConverter.toDistance('3000', 'kilometers')).toEqual(3);

      expect(parseInt(DistanceConverter.toDistance(4828.02, 'miles'), 10)).toEqual(3);
      expect(parseInt(DistanceConverter.toDistance('4828.02', 'miles'), 10)).toEqual(3);

      expect(DistanceConverter.toDistance(3, 'meters')).toEqual(3);
      expect(DistanceConverter.toDistance('3', 'meters')).toEqual(3);

      expect(DistanceConverter.toDistance(0, 'meters')).toEqual(0);
    });

    it('should throw error if val is invalid', function () {
      expect(function () { DistanceConverter.toDistance(null, 'meters'); }).toThrowError(/required/);
      expect(function () { DistanceConverter.toDistance('', 'meters'); }).toThrowError(/required/);
      expect(function () { DistanceConverter.toDistance('WAT', 'meters'); }).toThrowError(/required/);
    });

    it('should throw error if distance is invalid', function () {
      expect(function () { DistanceConverter.toDistance(3, 'lightyears'); }).toThrowError(/meters, /);
    });
  });
});
