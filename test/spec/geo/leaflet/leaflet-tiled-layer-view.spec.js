var Backbone = require('backbone');
var LeafletTiledLayerView = require('../../../../src/geo/leaflet/leaflet-tiled-layer-view');

describe('leaflet-tiled-layer-view', function () {
  describe('when does not support high resolution screens', function () {
    beforeEach(function () {
      this.layerModel = new Backbone.Model({
        urlTemplate: 'http://whatever.com',
        subdomains: 'a',
        opacity: 1,
        attribution: 'CARTO',
        errorTileUrl: 'http://matall.in',
        maxZoom: 10,
        minZoom: 0,
        tms: false
      });

      this.leafletMap = jasmine.createSpy('leafletMap');
      this.layerView = new LeafletTiledLayerView(this.layerModel, {
        nativeMap: this.leafletMap
      });
    });

    it('should have options set correctly', function () {
      expect(this.layerView.leafletLayer.options.subdomains).toEqual(['a']);
      expect(this.layerView.leafletLayer._url).toBe('http://whatever.com');
      expect(this.layerView.leafletLayer.options.attribution).toBe('CARTO');
      expect(this.layerView.leafletLayer.options.errorTileUrl).toBe('http://matall.in');
      expect(this.layerView.leafletLayer.options.maxZoom).toBe(10);
      expect(this.layerView.leafletLayer.options.minZoom).toBe(0);
      expect(this.layerView.leafletLayer.options.opacity).toBe(1);
      expect(this.layerView.leafletLayer.options.tms).toBeFalsy();
    });

    describe('._modelUpdated', function () {
      beforeEach(function () {
        this.layerModel.set({
          subdomains: ['b'],
          urlTemplate: 'http://hello.com',
          attribution: 'carto',
          maxZoom: 12,
          minZoom: 1,
          tms: true
        });
      });

      it('should update several attributes', function () {
        expect(this.layerView.leafletLayer.options.subdomains).toEqual(['b']);
        expect(this.layerView.leafletLayer.options.attribution).toBe('carto');
        expect(this.layerView.leafletLayer.options.errorTileUrl).toBe('http://matall.in');
        expect(this.layerView.leafletLayer.options.maxZoom).toBe(12);
        expect(this.layerView.leafletLayer.options.minZoom).toBe(1);
        expect(this.layerView.leafletLayer.options.opacity).toBe(1);
        expect(this.layerView.leafletLayer.options.tms).toBeTruthy();
      });

      it('should update url', function () {
        expect(this.layerView.leafletLayer._url).toBe('http://hello.com');
      });
    });

    it('should trigger load and loading events', function () {
      var loadCallback = jasmine.createSpy('loadCallback');
      this.layerView.bind('load', loadCallback);
      this.layerView.leafletLayer.fire('load');
      expect(loadCallback).toHaveBeenCalled();

      var loadingCallback = jasmine.createSpy('loadingCallback');
      this.layerView.bind('loading', loadingCallback);
      this.layerView.leafletLayer.fire('loading');
      expect(loadingCallback).toHaveBeenCalled();
    });
  });

  describe('when supports high resolution screens', function () {
    beforeEach(function () {
      this.layerModel = new Backbone.Model({
        urlTemplate: 'http://whatever.com',
        urlTemplate2x: 'http://whatever.com2x',
        subdomains: 'a',
        opacity: 1,
        attribution: 'CARTO',
        errorTileUrl: 'http://matall.in',
        maxZoom: 10,
        minZoom: 0,
        tms: false
      });
      this.leafletMap = jasmine.createSpy('leafletMap');
      this.layerView = new LeafletTiledLayerView(this.layerModel, {
        nativeMap: this.leafletMap
      });
    });

    describe('when is high resolution screen', function () {
      beforeEach(function () {
        spyOn(this.layerView, '_isHdpi').and.returnValue(true);
      });

      it('should update the model correctly if high resolution template is enabled', function () {
        this.layerModel.set({
          urlTemplate: 'http://hello.com',
          urlTemplate2x: 'http://hello.com2x'
        });

        expect(this.layerView.leafletLayer._url).toBe('http://hello.com2x');
      });

      it('should update the model correctly if high resolution template is not enabled', function () {
        this.layerModel.set({
          urlTemplate: 'http://hello.com'
        });

        expect(this.layerView.leafletLayer._url).toBe('http://hello.com');
      });
    });

    describe('when it is not a high resolution screen', function () {
      beforeEach(function () {
        spyOn(this.layerView, '_isHdpi').and.returnValue(false);
      });

      it('should update the model correctly if high resolution template is enabled', function () {
        this.layerModel.set({
          urlTemplate: 'http://hello.com',
          urlTemplate2x: 'http://hello.com2x'
        });

        expect(this.layerView.leafletLayer._url).toBe('http://hello.com');
      });
    });
  });
});
