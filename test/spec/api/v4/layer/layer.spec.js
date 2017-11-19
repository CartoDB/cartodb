var carto = require('../../../../../src/api/v4');

fdescribe('api/v4/layer', function () {
  var source;
  var style;

  beforeEach(function () {
    source = new carto.source.Dataset('ne_10m_populated_places_simple');
    style = new carto.style.CartoCSS('#layer {  marker-fill: red; }');
  });

  describe('constructor', function () {
    it('should build a new Layer params: (source, style)', function () {
      var layer = new carto.layer.Layer(source, style);

      expect(layer.getSource()).toEqual(source);
      expect(layer.getStyle()).toEqual(style);
    });

    it('should assign a unique layer ID string', function () {
      var layer1 = new carto.layer.Layer(source, style);
      var layer2 = new carto.layer.Layer(source, style);

      var id1 = layer1.getId();
      var id2 = layer2.getId();

      expect(id1).toMatch(/L\d+/);
      expect(id2).toMatch(/L\d+/);
      expect(id1).not.toEqual(id2);
    });

    it('should build a new Layer params: (source, style, options)', function () {
      var layer = new carto.layer.Layer(source, style, {
        featureClickColumns: ['a', 'b'],
        featureOverColumns: ['c', 'd']
      });

      expect(layer.getSource()).toEqual(source);
      expect(layer.getStyle()).toEqual(style);
      expect(layer.getFeatureClickColumns()).toEqual(['a', 'b']);
      expect(layer.getFeatureOverColumns()).toEqual(['c', 'd']);
    });

    it('should throw an error if source is not valid', function () {
      expect(function () {
        new carto.layer.Layer({}, style); // eslint-disable-line
      }).toThrowError('The given object is not a valid source. See "carto.source.Base"');
    });

    it('should throw an error if style is not valid', function () {
      expect(function () {
        new carto.layer.Layer(source, {}); // eslint-disable-line
      }).toThrowError('The given object is not a valid style. See "carto.style.Base"');
    });
  });

  describe('.setStyle', function () {
    var layer;
    var newStyle;
    beforeEach(function () {
      layer = new carto.layer.Layer(source, style);
      newStyle = new carto.style.CartoCSS('#layer {  marker-fill: green; }');
    });

    it('should throw an error when the parameter is not valid', function () {
      expect(function () {
        layer.setStyle('bad-style');
      }).toThrowError('The given object is not a valid style. See "carto.style.Base"');
    });

    it('should set the layer style', function () {
      layer.setStyle(newStyle);

      expect(layer.getStyle()).toEqual(newStyle);
    });

    it('should set the internal model style', function (done) {
      var client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        username: 'cartojs-test'
      });

      client.on(carto.events.ERROR, alert);
      client.addLayer(layer)
        .then(function () {
          client.on(carto.events.SUCCESS, function () {
            var expected = '#layer {  marker-fill: green; }';
            var actual = layer.$getInternalModel().get('cartocss');
            expect(expected).toEqual(actual);
            done();
          });
          layer.setStyle(newStyle);
        });
    });

    it('should fire a styleChanged event', function (done) {
      layer.on('styleChanged', function (l) {
        expect(l).toBe(layer);
        expect(l.getStyle()).toEqual(newStyle);
        done();
      });

      layer.setStyle(newStyle);
    });

    it('should fire a styleChanged event when the layer belongs to a client', function (done) {
      var client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        username: 'cartojs-test'
      });
      var styleChangedSpy = jasmine.createSpy('styleChangedSpy');
      layer.on('styleChanged', styleChangedSpy);

      client.addLayer(layer)
        .then(function () {
          return layer.setStyle(newStyle);
        })
        .then(function () {
          expect(styleChangedSpy).toHaveBeenCalled();
          done();
        });
    });

    it('should not fire a styleChanged event when setting the same style twice', function () {
      var styleChangedSpy = jasmine.createSpy('styleChangedSpy');
      layer.on('styleChanged', styleChangedSpy);

      layer.setStyle(style);

      expect(styleChangedSpy).not.toHaveBeenCalled();
    });
  });

  describe('.setSource', function () {
    var layer;
    var newSource;

    beforeEach(function () {
      layer = new carto.layer.Layer(source, style);
      newSource = new carto.source.SQL('SELECT * FROM ne_10m_populated_places_simple LIMIT 10');
    });

    it('should throw an error when the source is not a valid parameter', function () {
      expect(function () {
        layer.setSource('bad-parameter');
      }).toThrowError('The given object is not a valid source. See "carto.source.Base"');
    });

    describe("when the layer hasn't been set an engine", function () {
      it('should normally add the source', function () {
        layer.setSource(newSource);

        expect(layer.getSource()).toEqual(newSource);
      });

      it('should fire a sourceChanged event', function (done) {
        layer.on('sourceChanged', function (l) {
          expect(l).toBe(layer);
          expect(l.getSource()).toEqual(newSource);
          done();
        });

        layer.setSource(newSource);
      });
    });

    describe('when the layer has been set an engine', function () {
      var engineMock;
      beforeEach(function () {
        engineMock = { on: jasmine.createSpy('on'), reload: jasmine.createSpy('reload').and.returnValue(Promise.resolve()) };
        layer.$setEngine(engineMock);
      });

      describe('and the source has no engine', function () {
        it('should normally add the source', function () {
          layer.setSource(newSource);

          var actualSource = layer.$getInternalModel().get('source');
          var expectedSource = newSource.$getInternalModel();
          expect(actualSource).toEqual(expectedSource);
        });

        it('should fire a sourceChanged event', function (done) {
          var sourceChangedSpy = jasmine.createSpy('sourceChangedSpy');
          layer.on('sourceChanged', sourceChangedSpy);

          layer.setSource(newSource)
            .then(function () {
              expect(sourceChangedSpy).toHaveBeenCalled();
              done();
            });
        });
      });

      describe('and the source has an engine', function () {
        it('should add the source if the engines are the same', function () {
          newSource.$setEngine(engineMock);

          layer.setSource(newSource);

          var actualSource = layer.$getInternalModel().get('source');
          var expectedSource = newSource.$getInternalModel();
          expect(actualSource).toEqual(expectedSource);
        });

        it('should throw an error if the engines are different', function () {
          // This engine is different from the layer's one.
          var engineMock1 = { on: jasmine.createSpy('on'), reload: jasmine.createSpy('reload') };
          newSource.$setEngine(engineMock1);

          expect(function () {
            layer.setSource(newSource);
          }).toThrowError('A layer can\'t have a source which belongs to a different client');
        });
      });
    });

    it('should not fire a sourceChanged event when setting the same source twice', function () {
      var sourceChangedSpy = jasmine.createSpy('sourceChangedSpy');
      layer.on('sourceChanged', sourceChangedSpy);

      layer.setSource(source);

      expect(sourceChangedSpy).not.toHaveBeenCalled();
    });
  });

  describe('.show', function () {
    it('should set the layer visibility to true', function () {
      var layer = new carto.layer.Layer(source, style);
      expect(layer.isVisible()).toEqual(true);

      layer.hide();

      expect(layer.isVisible()).toEqual(false);
      expect(layer.isHidden()).toEqual(true);

      layer.show();

      expect(layer.isVisible()).toEqual(true);
      expect(layer.isHidden()).toEqual(false);
    });

    it('should trigger a visibilityChanged event', function (done) {
      var layer = new carto.layer.Layer(source, style);
      expect(layer.isVisible()).toEqual(true);

      layer.hide();

      layer.on('visibilityChanged', function () {
        expect(layer.isVisible()).toEqual(true);
        expect(layer.isHidden()).toEqual(false);
        done();
      });

      layer.show();
    });
  });

  describe('.hide', function () {
    it('should set the layer visibility to false', function () {
      var layer = new carto.layer.Layer(source, style);
      expect(layer.isVisible()).toEqual(true);

      layer.hide();

      expect(layer.isVisible()).toEqual(false);
      expect(layer.isHidden()).toEqual(true);
    });

    it('should trigger a visibilityChanged event', function (done) {
      var layer = new carto.layer.Layer(source, style);
      expect(layer.isVisible()).toEqual(true);

      layer.on('visibilityChanged', function () {
        expect(layer.isVisible()).toEqual(false);
        expect(layer.isHidden()).toEqual(true);
        done();
      });

      layer.hide();
    });
  });

  describe('.toggle', function () {
    it('should toggle the layer visibility', function () {
      var layer = new carto.layer.Layer(source, style);
      expect(layer.isVisible()).toEqual(true);

      layer.toggle();

      expect(layer.isVisible()).toEqual(false);
      expect(layer.isHidden()).toEqual(true);

      layer.toggle();

      expect(layer.isVisible()).toEqual(true);
      expect(layer.isHidden()).toEqual(false);
    });

    it('should trigger a visibilityChanged event', function (done) {
      var layer = new carto.layer.Layer(source, style);
      expect(layer.isVisible()).toEqual(true);

      layer.on('visibilityChanged', function () {
        expect(layer.isVisible()).toEqual(false);
        expect(layer.isHidden()).toEqual(true);
        done();
      });

      layer.toggle();
    });
  });
});
