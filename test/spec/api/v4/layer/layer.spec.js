var carto = require('../../../../../src/api/v4');

describe('api/v4/layer', function () {
  var source;
  var style;
  var originalTimeout;

  beforeEach(function () {
    source = new carto.source.Dataset('ne_10m_populated_places_simple');
    style = new carto.style.CartoCSS('#layer {  marker-fill: red; }');
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  afterEach(function () {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
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

    it('should be able to create a hidden layer', function () {
      var layer = new carto.layer.Layer(source, style, {
        visible: false
      });

      expect(layer.isHidden()).toBe(true);
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
      }).toThrowError('The given object is not a valid source. See "carto.source.Base".');
    });

    it('should throw an error if style is not valid', function () {
      expect(function () {
        new carto.layer.Layer(source, {}); // eslint-disable-line
      }).toThrowError('The given object is not a valid style. See "carto.style.Base".');
    });

    it('should allow custom layer id as an option', function () {
      var layer = new carto.layer.Layer(source, style, { id: 'fake_id' });
      expect(layer.getId()).toEqual('fake_id');
    });

    describe('columns validation', function () {
      var aggregation = new carto.layer.Aggregation({
        threshold: 1,
        resolution: 4,
        columns: {
          population: {
            aggregateFunction: 'sum',
            aggregatedColumn: 'pop_max'
          }
        }
      });

      it('should validate that featureClick columns are contained in aggregation columns', function () {
        expect(function () {
          new carto.layer.Layer(source, style, { // eslint-disable-line
            featureClickColumns: ['a', 'b'],
            aggregation: aggregation
          });
        }).toThrowError('Columns [a, b] set on `featureClick` do not match the columns set in aggregation options.');
      });

      it('should validate that featureOver columns are contained in aggregation columns', function () {
        expect(function () {
          new carto.layer.Layer(source, style, { // eslint-disable-line
            featureOverColumns: ['a', 'b'],
            aggregation: aggregation
          });
        }).toThrowError('Columns [a, b] set on `featureOver` do not match the columns set in aggregation options.');
      });
    });
  });

  describe('.setStyle', function () {
    var layer;
    var newStyle;
    beforeEach(function () {
      layer = new carto.layer.Layer(source, style);
      newStyle = new carto.style.CartoCSS('#layer {  marker-fill: green; }');
    });

    it('should throw an error when the parameter is not a valid style', function () {
      expect(function () {
        layer.setStyle('bad-style');
      }).toThrowError('The given object is not a valid style. See "carto.style.Base".');
    });

    describe('when the layer has no engine', function () {
      it('should set the layer style', function () {
        layer.setStyle(newStyle);

        expect(layer.getStyle()).toEqual(newStyle);
      });

      it('should fire a styleChanged event', function (done) {
        layer.on('styleChanged', function (l) {
          expect(l).toBe(layer);
          expect(l.getStyle()).toEqual(newStyle);
          done();
        });

        layer.setStyle(newStyle);
      });

      it('should not fire a styleChanged event when setting the same style twice', function () {
        var styleChangedSpy = jasmine.createSpy('styleChangedSpy');
        layer.on('styleChanged', styleChangedSpy);

        layer.setStyle(style);

        expect(styleChangedSpy).not.toHaveBeenCalled();
      });
    });

    describe('when the layer has an engine', function () {
      var client;
      beforeEach(function () {
        client = new carto.Client({
          apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
          username: 'cartojs-test'
        });
      });

      describe('and the style has no engine', function () {
        it('should set the engine into the style and update the internal style.', function (done) {
          client.addLayer(layer)
            .then(function () {
              return layer.setStyle(newStyle);
            })
            .then(function () {
              expect(layer.getStyle().$getEngine()).toBe(layer._engine);
              done();
            });
        });
      });

      describe('and the style has an engine', function () {
        it('should update the internal style when the engines are equal', function (done) {
          newStyle.$setEngine(client._engine);
          client.addLayer(layer)
            .then(function () {
              return layer.setStyle(newStyle);
            })
            .then(function () {
              expect(layer.getStyle().$getEngine()).toBe(layer._engine);
              done();
            });
        });

        it('should throw an error when the engines are not equal', function (done) {
          newStyle.$setEngine('fakeEngine');
          client.addLayer(layer)
            .then(function () {
              expect(function () {
                return layer.setStyle(newStyle);
              }).toThrowError('A layer can\'t have a style which belongs to a different client.');
              done();
            });
        });
      });

      it('should fire a cartoError when the style is invalid', function (done) {
        var styleChangedSpy = jasmine.createSpy('styleChangedSpy');
        layer.on('error', styleChangedSpy);
        client.addLayer(layer)
          .then(function () {
            var malformedStyle = new carto.style.CartoCSS('#layer { invalid-rule: foo}');
            return layer.setStyle(malformedStyle);
          })
          .catch(function () {
            expect(styleChangedSpy).toHaveBeenCalled();
            done();
          });
      });

      it('should fire a styleChanged event when the layer belongs to a client', function (done) {
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
    });
  });

  describe('.$setEngine', function () {
    it('probando', function () {
      var layer = new carto.layer.Layer(source, style);
      var engineMock = { on: jasmine.createSpy('on'), reload: jasmine.createSpy('reload').and.returnValue(Promise.resolve()) };
      var error = {
        message: 'an error'
      };
      var capturedError;
      layer.$setEngine(engineMock);
      layer.on(carto.events.ERROR, function (error) {
        capturedError = error;
      });

      layer._internalModel.set('error', error);

      expect(capturedError).toBeDefined();
      expect(capturedError.name).toEqual('CartoError');
      expect(capturedError.message).toEqual('an error');
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
      }).toThrowError('The given object is not a valid source. See "carto.source.Base".');
    });

    describe('when the layer hasn\'t been set an engine', function () {
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
        it('should normally add the source', function (done) {
          layer.setSource(newSource)
            .then(function () {
              var actualSource = layer.$getInternalModel().get('source');
              var expectedSource = newSource.$getInternalModel();
              expect(actualSource).toBeDefined();
              expect(actualSource).toEqual(expectedSource);
              done();
            });
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
          }).toThrowError('A layer can\'t have a source which belongs to a different client.');
        });
      });
    });

    it('should not fire a sourceChanged event when setting the same source twice', function () {
      var sourceChangedSpy = jasmine.createSpy('sourceChangedSpy');
      layer.on('sourceChanged', sourceChangedSpy);

      layer.setSource(source);

      expect(sourceChangedSpy).not.toHaveBeenCalled();
    });

    it('should fire a cartoError when the source is invalid', function (done) {
      var client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        username: 'cartojs-test'
      });
      var sourceChangedSoy = jasmine.createSpy('sourceChangedSoy');
      layer.on('error', sourceChangedSoy);
      client.addLayer(layer)
        .then(function () {
          var invalidDataset = new carto.source.Dataset('invalid_dataset');
          return layer.setSource(invalidDataset);
        })
        .catch(function () {
          expect(sourceChangedSoy).toHaveBeenCalled();
          done();
        });
    });
  });

  describe('.setFeatureClickColumns', function () {
    var layer;
    var newColums;

    beforeEach(function () {
      layer = new carto.layer.Layer(source, style);
      newColums = ['a', 'b'];
    });

    it('should throw an error when the columns are not a valid parameter', function () {
      expect(function () {
        layer.setFeatureClickColumns([1, 2, 3]);
      }).toThrowError('The given object is not a valid array of string columns.');
    });

    describe('when the layer hasn\'t been set an engine', function () {
      it('should normally add the columns', function () {
        layer.setFeatureClickColumns(newColums);

        expect(layer.getFeatureClickColumns()).toEqual(newColums);
      });
    });

    describe('when the layer has been set an engine', function () {
      var engineMock;

      it('should normally add the columns', function (done) {
        engineMock = { on: jasmine.createSpy('on'), reload: jasmine.createSpy('reload').and.returnValue(Promise.resolve()) };
        layer.$setEngine(engineMock);

        layer.setFeatureClickColumns(newColums)
          .then(function () {
            var actualColumns = layer.getFeatureClickColumns();
            var expectedColumns = newColums;
            expect(actualColumns).toBeDefined();
            expect(actualColumns).toEqual(expectedColumns);
            done();
          });
      });

      it('should throw an error when the columns are not valid', function (done) {
        engineMock = { on: jasmine.createSpy('on'), reload: jasmine.createSpy('reload').and.returnValue(Promise.reject(new Error())) };
        layer.$setEngine(engineMock);

        layer.setFeatureClickColumns(['wrong'])
          .catch(function (error) {
            expect(error instanceof Error).toBe(true);
            done();
          });
      });

      it('should fire an error event when the columns are not valid', function (done) {
        engineMock = { on: jasmine.createSpy('on'), reload: jasmine.createSpy('reload').and.returnValue(Promise.reject(new Error())) };
        layer.$setEngine(engineMock);

        var columnChangedError = jasmine.createSpy('columnChangedError');
        layer.on('error', columnChangedError);

        layer.setFeatureClickColumns(['wrong'])
          .catch(function () {
            expect(columnChangedError).toHaveBeenCalled();
            done();
          });
      });
    });
  });

  describe('.setFeatureOverColumns', function () {
    var layer;
    var newColums;

    beforeEach(function () {
      layer = new carto.layer.Layer(source, style);
      newColums = ['a', 'b'];
    });

    it('should throw an error when the columns are not a valid parameter', function () {
      expect(function () {
        layer.setFeatureOverColumns([1, 2, 3]);
      }).toThrowError('The given object is not a valid array of string columns.');
    });

    describe('when the layer hasn\'t been set an engine', function () {
      it('should normally add the columns', function () {
        layer.setFeatureOverColumns(newColums);

        expect(layer.getFeatureOverColumns()).toEqual(newColums);
      });
    });

    describe('when the layer has been set an engine', function () {
      var engineMock;

      it('should normally add the columns', function (done) {
        engineMock = { on: jasmine.createSpy('on'), reload: jasmine.createSpy('reload').and.returnValue(Promise.resolve()) };
        layer.$setEngine(engineMock);

        layer.setFeatureOverColumns(newColums)
          .then(function () {
            var actualColumns = layer.getFeatureOverColumns();
            var expectedColumns = newColums;
            expect(actualColumns).toBeDefined();
            expect(actualColumns).toEqual(expectedColumns);
            done();
          });
      });

      it('should throw an error when the columns are not valid', function (done) {
        engineMock = { on: jasmine.createSpy('on'), reload: jasmine.createSpy('reload').and.returnValue(Promise.reject(new Error())) };
        layer.$setEngine(engineMock);

        layer.setFeatureOverColumns(['wrong'])
          .catch(function (error) {
            expect(error instanceof Error).toBe(true);
            done();
          });
      });

      it('should fire an error event when the columns are not valid', function (done) {
        engineMock = { on: jasmine.createSpy('on'), reload: jasmine.createSpy('reload').and.returnValue(Promise.reject(new Error())) };
        layer.$setEngine(engineMock);

        var columnChangedError = jasmine.createSpy('columnChangedError');
        layer.on('error', columnChangedError);

        layer.setFeatureOverColumns(['wrong'])
          .catch(function () {
            expect(columnChangedError).toHaveBeenCalled();
            done();
          });
      });
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

  describe('.setOrder', function () {
    it('should call moveLayer with the passed index', function () {
      var clientMock = { moveLayer: jasmine.createSpy('moveLayer') };
      var layer = new carto.layer.Layer(source, style);
      layer.$setClient(clientMock);

      layer.setOrder(1);
      expect(clientMock.moveLayer).toHaveBeenCalledWith(layer, 1);
    });
  });

  describe('.bringToBack', function () {
    it('should call moveLayer with the passed index', function () {
      var clientMock = { moveLayer: jasmine.createSpy('moveLayer') };
      var layer = new carto.layer.Layer(source, style);
      layer.$setClient(clientMock);

      layer.bringToBack();
      expect(clientMock.moveLayer).toHaveBeenCalledWith(layer, 0);
    });
  });

  describe('.bringToFront', function () {
    it('should call moveLayer with the passed index', function () {
      var numberOfLayers = 3;
      var clientMock = { moveLayer: jasmine.createSpy('moveLayer'), _layers: { size: function () { return numberOfLayers; } } };
      var layer = new carto.layer.Layer(source, style);
      layer.$setClient(clientMock);

      layer.bringToFront();
      expect(clientMock.moveLayer).toHaveBeenCalledWith(layer, numberOfLayers - 1);
    });
  });

  describe('.isInteractive', function () {
    it('returns true if layer has featureClickColumns', function () {
      const layer = new carto.layer.Layer(source, style, {
        featureClickColumns: ['cartodb_id']
      });

      expect(layer.isInteractive()).toBe(true);
    });

    it('returns true if layer has featureOverColumns', function () {
      const layer = new carto.layer.Layer(source, style, {
        featureOverColumns: ['cartodb_id']
      });

      expect(layer.isInteractive()).toBe(true);
    });

    it('returns false if layer doesn\'t have getFeatureClickColumns or getFeatureHoverColumns', function () {
      const layer = new carto.layer.Layer(source, style);

      expect(layer.isInteractive()).toBe(false);
    });
  });

  xit('should update "internalmodel.cartocss" when the style is updated', function (done) {
    var client = new carto.Client({
      apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
      username: 'cartojs-test'
    });
    var layer = new carto.layer.Layer(source, style);
    var newStyle = '#layer { marker-fill: #FABADA; }';

    client.addLayer(layer)
      .then(function () {
        return style.setContent(newStyle);
      })
      .then(function () {
        expect(layer.$getInternalModel().get('cartocss')).toEqual(newStyle);
        done();
      });
  });
});
