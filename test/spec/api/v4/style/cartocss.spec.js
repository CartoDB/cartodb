var carto = require('../../../../../src/api/v4');

describe('api/v4/style/cartocss', function () {
  var cartoCSS;

  beforeEach(function () {
    cartoCSS = new carto.style.CartoCSS('#layer { marker-with:10; }');
  });

  describe('constructor', function () {
    it('should return an object', function () {
      expect(cartoCSS).toBeDefined();
    });

    it('should throw an error if cartoCSS is not provided', function () {
      expect(function () {
        new carto.style.CartoCSS(); // eslint-disable-line
      }).toThrowError('cartoCSS is required.');
    });

    it('should throw an error if cartoCSS is empty', function () {
      expect(function () {
        new carto.style.CartoCSS(''); // eslint-disable-line
      }).toThrowError('cartoCSS is required.');
    });

    it('should throw an error if cartoCSS is not a valid string', function () {
      expect(function () {
        new carto.style.CartoCSS(3333); // eslint-disable-line
      }).toThrowError('cartoCSS must be a string.');
    });
  });
});
