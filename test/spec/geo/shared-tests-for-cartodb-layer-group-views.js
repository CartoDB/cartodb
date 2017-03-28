var _ = require('underscore');
var $ = require('jquery');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer.js');
var LayersCollection = require('../../../src/geo/map/layers.js');
var CartoDBLayerGroup = require('../../../src/geo/cartodb-layer-group.js');
var EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

var FakeWax = require('./fake-wax');
var fakeWax = FakeWax();

module.exports = function (createLayerGroupView, expectTileURLTemplateToMatch, fireNativeEvent) {
  describe('shared tests for CartoDBLayerGroupViews', function () {
    beforeEach(function () {
      fakeWax.tilejson.calls.reset();
      fakeWax.map.calls.reset();

      // Disable debounce
      spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });

      this.container = $('<div id="map">').css('height', '200px');
      $('body').append(this.container);

      this.cartoDBLayer1 = new CartoDBLayer({}, { vis: { on: function () {} } });
      this.cartoDBLayer2 = new CartoDBLayer({}, { vis: { on: function () {} } });
      this.layersCollection = new LayersCollection([
        this.cartoDBLayer1, this.cartoDBLayer2
      ]);
      this.layerGroupModel = new CartoDBLayerGroup({
        urls: {
          'subdomains': [0, 1, 2, 3],
          'tiles': 'http://{s}.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/{layerIndexes}/{z}/{x}/{y}.png',
          'grids': [
            [
              'http://0.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://1.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://2.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://3.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json'
            ],
            [
              'http://0.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://1.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://2.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://3.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json'
            ]
          ],
          'attributes': [
            'http://ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/attributes',
            'http://ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/attributes'
          ]
        },
        indexOfLayersInWindshaft: [1, 2]
      }, {
        layersCollection: this.layersCollection
      });

      this.layerGroupView = createLayerGroupView(this.layerGroupModel, this.container[0]);
    });

    afterEach(function () {
      fakeWax.unbindEvents();
      this.container.remove();
    });

    it('should fetch tiles', function () {
      expectTileURLTemplateToMatch(this.layerGroupView, 'http://{s}.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1,2/{z}/{x}/{y}.png');
    });

    it('should enable interaction', function () {
      expect(fakeWax.tilejson.calls.count()).toEqual(2);
      expect(fakeWax.tilejson.calls.argsFor(0)[0]).toEqual({
        'tilejson': '2.0.0',
        'scheme': 'xyz',
        'grids': [
          'http://0.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
          'http://1.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
          'http://2.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
          'http://3.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json'
        ],
        'tiles': [
          'http://0.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1,2/{z}/{x}/{y}.png',
          'http://1.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1,2/{z}/{x}/{y}.png',
          'http://2.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1,2/{z}/{x}/{y}.png',
          'http://3.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1,2/{z}/{x}/{y}.png'
        ],
        'formatter': jasmine.any(Function)
      });

      expect(fakeWax.tilejson.calls.argsFor(1)[0]).toEqual({
        'tilejson': '2.0.0',
        'scheme': 'xyz',
        'grids': [
          'http://0.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
          'http://1.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
          'http://2.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
          'http://3.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json'
        ],
        'tiles': [
          'http://0.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1,2/{z}/{x}/{y}.png',
          'http://1.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1,2/{z}/{x}/{y}.png',
          'http://2.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1,2/{z}/{x}/{y}.png',
          'http://3.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1,2/{z}/{x}/{y}.png'
        ],
        'formatter': jasmine.any(Function)
      });
    });

    describe('when a layer is hidden', function () {
      beforeEach(function () {
        fakeWax.tilejson.calls.reset();

        this.cartoDBLayer2.set('visible', false);
      });

      it('should fetch tiles', function () {
        expectTileURLTemplateToMatch(this.layerGroupView, 'http://{s}.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.png');
      });

      it('should reload interaction', function () {
        expect(fakeWax.tilejson.calls.count()).toEqual(1);
        expect(fakeWax.tilejson.calls.argsFor(0)[0]).toEqual({
          'tilejson': '2.0.0',
          'scheme': 'xyz',
          'grids': [
            'http://0.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
            'http://1.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
            'http://2.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
            'http://3.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json'
          ],
          'tiles': [
            'http://0.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.png',
            'http://1.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.png',
            'http://2.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.png',
            'http://3.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.png'
          ],
          'formatter': jasmine.any(Function)
        });
      });
    });

    describe('event firing', function () {
      beforeEach(function () {
        this.nativeMap = fakeWax.map.calls.argsFor(0)[0];

        this.layersCollection.reset([this.cartoDBLayer1]);
      });

      it('should trigger a "featureOver" event', function () {
        var callback = jasmine.createSpy('callback');
        this.layerGroupView.on('featureOver', callback);

        fakeWax.fire('on', {
          e: {
            type: 'mousemove',
            clientX: 10,
            clientY: 20
          },
          data: { cartodb_id: 10 }
        });

        expect(callback.calls.argsFor(0)[0]).toEqual({
          layer: this.cartoDBLayer1,
          layerIndex: 0,
          latlng: [jasmine.any(Number), jasmine.any(Number)],
          position: { x: jasmine.any(Number), y: jasmine.any(Number) },
          feature: { cartodb_id: 10 }
        });
      });

      it('should NOT trigger a "featureOver" event if layer has been removed', function () {
        var callback = jasmine.createSpy('callback');
        this.layerGroupView.on('featureOver', callback);

        this.layersCollection.remove(this.cartoDBLayer1);

        fakeWax.fire('on', {
          e: {
            type: 'mousemove',
            clientX: 10,
            clientY: 20
          },
          data: { cartodb_id: 10 }
        });

        expect(callback).not.toHaveBeenCalled();
      });

      _.each([
        'click'
      ], function (eventName) {
        it('should trigger a "featureClick" event when wax fires a "' + eventName + '" event', function () {
          var callback = jasmine.createSpy('callback');
          this.layerGroupView.on('featureClick', callback);

          var waxEvent = {
            type: eventName,
            clientX: 10,
            clientY: 20
          };
          fakeWax.fire('on', {
            e: waxEvent,
            data: { cartodb_id: 10 }
          });

          expect(callback.calls.argsFor(0)[0]).toEqual({
            layer: this.cartoDBLayer1,
            layerIndex: 0,
            latlng: [jasmine.any(Number), jasmine.any(Number)],
            position: { x: jasmine.any(Number), y: jasmine.any(Number) },
            feature: { cartodb_id: 10 }
          });
        });

        it('should NOT trigger a "featureClick" event when wax fires a "' + eventName + '" event and the layer has been removed', function () {
          var callback = jasmine.createSpy('callback');
          this.layerGroupView.on('featureClick', callback);

          this.layersCollection.remove(this.cartoDBLayer1);

          var waxEvent = {
            type: eventName,
            clientX: 10,
            clientY: 20
          };
          fakeWax.fire('on', {
            e: waxEvent,
            data: { cartodb_id: 10 }
          });

          expect(callback).not.toHaveBeenCalled();
        });
      });

      it('should trigger a "featureOut" event', function () {
        var callback = jasmine.createSpy('callback');
        this.layerGroupView.on('featureOut', callback);

        fakeWax.fire('off', {
          e: {}
        });

        expect(callback.calls.argsFor(0)[0]).toEqual({
          layer: this.cartoDBLayer1,
          layerIndex: 0
        });
      });

      it('should NOT trigger a "featureOut" event if the layer has been removed', function () {
        var callback = jasmine.createSpy('callback');
        this.layerGroupView.on('featureOut', callback);

        this.layersCollection.remove(this.cartoDBLayer1);
        this.layersCollection.remove(this.cartoDBLayer2);

        fakeWax.fire('off', {
          e: {}
        });

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('when new urls are set', function () {
      beforeEach(function () {
        fakeWax.tilejson.calls.reset();

        this.layerGroupModel.set('urls', {
          'subdomains': [0, 1, 2, 3],
          'tiles': 'http://{s}.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/{layerIndexes}/{z}/{x}/{y}.png',
          'grids': [
            [
              'http://0.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/{z}/{x}/{y}.grid.json',
              'http://1.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/{z}/{x}/{y}.grid.json',
              'http://2.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/{z}/{x}/{y}.grid.json',
              'http://3.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/{z}/{x}/{y}.grid.json'
            ],
            [
              'http://0.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1/{z}/{x}/{y}.grid.json',
              'http://1.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1/{z}/{x}/{y}.grid.json',
              'http://2.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1/{z}/{x}/{y}.grid.json',
              'http://3.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1/{z}/{x}/{y}.grid.json'
            ]
          ],
          'attributes': [
            'http://ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/attributes',
            'http://ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1/attributes'
          ]
        });
      });

      it('should set the URL template', function () {
        expectTileURLTemplateToMatch(this.layerGroupView, 'http://{s}.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1,2/{z}/{x}/{y}.png');
      });

      it('should reload interaction', function () {
        expect(fakeWax.tilejson.calls.count()).toEqual(2);
        expect(fakeWax.tilejson.calls.argsFor(0)[0]).toEqual({
          'tilejson': '2.0.0',
          'scheme': 'xyz',
          'grids': [
            'http://0.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/{z}/{x}/{y}.grid.json',
            'http://1.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/{z}/{x}/{y}.grid.json',
            'http://2.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/{z}/{x}/{y}.grid.json',
            'http://3.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/{z}/{x}/{y}.grid.json'
          ],
          'tiles': [
            'http://0.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1,2/{z}/{x}/{y}.png',
            'http://1.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1,2/{z}/{x}/{y}.png',
            'http://2.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1,2/{z}/{x}/{y}.png',
            'http://3.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1,2/{z}/{x}/{y}.png'
          ],
          'formatter': jasmine.any(Function)
        });

        expect(fakeWax.tilejson.calls.argsFor(1)[0]).toEqual({
          'tilejson': '2.0.0',
          'scheme': 'xyz',
          'grids': [
            'http://0.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1/{z}/{x}/{y}.grid.json',
            'http://1.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1/{z}/{x}/{y}.grid.json',
            'http://2.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1/{z}/{x}/{y}.grid.json',
            'http://3.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1/{z}/{x}/{y}.grid.json'
          ],
          'tiles': [
            'http://0.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1,2/{z}/{x}/{y}.png',
            'http://1.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1,2/{z}/{x}/{y}.png',
            'http://2.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1,2/{z}/{x}/{y}.png',
            'http://3.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1,2/{z}/{x}/{y}.png'
          ],
          'formatter': jasmine.any(Function)
        });
      });
    });

    describe("when there aren't tile URLS", function () {
      beforeEach(function () {
        fakeWax.tilejson.calls.reset();

        this.layerGroupModel.set('urls', {
          'tiles': '',
          'grids': [
          ],
          'attributes': [
            'http://ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/attributes'
          ]
        });
      });

      it('should fetch empty tiles', function () {
        expectTileURLTemplateToMatch(this.layerGroupView, EMPTY_GIF);
      });
    });

    it('should trigger load and loading events', function () {
      var loadCallback = jasmine.createSpy('loadCallback');
      var loadingCallback = jasmine.createSpy('loadingCallback');
      this.layerGroupView.bind('load', loadCallback);
      this.layerGroupView.bind('loading', loadingCallback);

      fireNativeEvent(this.layerGroupView, 'load');
      fireNativeEvent(this.layerGroupView, 'loading');

      expect(loadCallback).toHaveBeenCalled();
      expect(loadingCallback).toHaveBeenCalled();
    });
  });
};
