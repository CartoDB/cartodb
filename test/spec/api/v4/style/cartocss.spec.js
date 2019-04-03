var carto = require('../../../../../src/api/v4');

describe('api/v4/style/cartocss', function () {
  var cartoCSS;

  beforeEach(function () {
    cartoCSS = new carto.style.CartoCSS('#layer { marker-width:10; }');
  });

  describe('constructor', function () {
    it('should return an object', function () {
      expect(cartoCSS).toBeDefined();
    });

    it('should throw an error if cartoCSS is not provided', function () {
      expect(function () {
        new carto.style.CartoCSS(); // eslint-disable-line
      }).toThrowError('CartoCSS is required.');
    });

    it('should throw an error if cartoCSS is empty', function () {
      expect(function () {
        new carto.style.CartoCSS(''); // eslint-disable-line
      }).toThrowError('CartoCSS is required.');
    });

    it('should throw an error if cartoCSS is not a valid string', function () {
      expect(function () {
        new carto.style.CartoCSS(true); // eslint-disable-line
      }).toThrowError('CartoCSS must be a string.');
    });
  });

  describe('errors', function () {
    it('should trigger a CartoError when the style is not valid', function (done) {
      var client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        username: 'cartojs-test'
      });
      var source = new carto.source.Dataset('ne_10m_populated_places_simple');
      var invalidCartoCSS = new carto.style.CartoCSS('#layer { invalid-property: 10; }');

      invalidCartoCSS.on('error', function (cartoError) {
        expect(cartoError.message).toMatch(/Unrecognized rule "invalid-property"/);
        done();
      });
      var layer = new carto.layer.Layer(source, invalidCartoCSS);
      client.addLayer(layer)
        .catch(function () { }); // Prevent console "uncaught error" warning.
    });

    it('should NOT trigger a CartoError when the style is valid but there are some other errors', function (done) {
      var client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        username: 'cartojs-test'
      });
      var source = new carto.source.Dataset('invalid_dataset');
      var invalidCartoCSS = new carto.style.CartoCSS('#layer { marker-with: 10; }');
      var errorCallbackSpy = jasmine.createSpy('errorCallbackSpy').and.callThrough();
      invalidCartoCSS.on('error', errorCallbackSpy);
      var layer = new carto.layer.Layer(source, invalidCartoCSS);

      client.addLayer(layer)
        .catch(function () {
          expect(errorCallbackSpy).not.toHaveBeenCalled();
          done();
        });
    });
  });

  describe('.getContent', function () {
    it('should return the internal style', function () {
      var expected = '#layer { marker-width:10; }';
      var actual = cartoCSS.getContent();

      expect(actual).toEqual(expected);
    });
  });

  describe('.setContent', function () {
    var layer;
    var source;
    var newContent;

    beforeEach(function () {
      source = new carto.source.Dataset('ne_10m_populated_places_simple');
      layer = new carto.layer.Layer(source, cartoCSS);
      newContent = '#layer { marker-fill: #FABADA }';
    });

    describe('when no engine is attached', function () {
      it('should update the internal style', function (done) {
        cartoCSS.setContent(newContent)
          .then(function () {
            expect(cartoCSS.getContent()).toEqual(newContent);
            done();
          });
      });

      it('should trigger a contentChanged event', function (done) {
        var contentChangedSpy = jasmine.createSpy('contentChangedSpy');
        cartoCSS.on('contentChanged', contentChangedSpy);
        cartoCSS.setContent(newContent)
          .then(function () {
            expect(cartoCSS.getContent()).toEqual(newContent);
            expect(contentChangedSpy).toHaveBeenCalled();
            done();
          });
      });
    });

    describe('when an engine is attached', function () {
      var client;

      beforeAll(function () {
        client = new carto.Client({
          apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
          username: 'cartojs-test'
        });
      });

      it('should update the internal style', function (done) {
        client.addLayer(layer)
          .then(function () {
            return cartoCSS.setContent(newContent);
          })
          .then(function () {
            expect(cartoCSS.getContent()).toEqual(newContent);
            done();
          });
      });

      it('should trigger a contentChanged event?', function (done) {
        var contentChangedSpy = jasmine.createSpy('contentChangedSpy');
        cartoCSS.on('contentChanged', contentChangedSpy);

        client.addLayer(layer)
          .then(function () {
            return cartoCSS.setContent(newContent);
          })
          .then(function () {
            expect(contentChangedSpy).toHaveBeenCalled();
            done();
          })
          .catch(console.warn);
      });

      it('should reject the promise with a CartoError when the reload fails', function (done) {
        var malformedStyle = '#layer { invalid-property: foo }';
        client.addLayer(layer)
          .then(function () {
            return cartoCSS.setContent(malformedStyle);
          })
          .catch(function (cartoError) {
            expect(cartoError.message).toMatch(/Unrecognized rule "invalid-property"/);
            done();
          });
      });
    });
  });
});
