var carto = require('../../../../../src/api/v4');

fdescribe('api/v4/style/cartocss', function () {
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

  describe('errors', function () {
    it('should trigger a CartoError when the style is not valid', function (done) {
      var client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        username: 'cartojs-test'
      });
      var source = carto.source.Dataset('ne_10m_populated_places_simple');
      var invalidCartoCSS = new carto.style.CartoCSS('#layer { invalid-property: 10; }');

      invalidCartoCSS.on('error', function (cartoError) {
        expect(cartoError.message).toEqual('');
        done();
      });
      var layer = new carto.layer.Layer(source, invalidCartoCSS);
      client.addLayer(layer);
    });
  });
});
