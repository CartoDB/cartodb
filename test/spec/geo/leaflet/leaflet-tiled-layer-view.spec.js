var Backbone = require('backbone');
var LeafletTiledLayerView = require('../../../../src/geo/leaflet/leaflet-tiled-layer-view');

describe('leaflet-tiled-layer-view', function () {
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
    this.layerView = new LeafletTiledLayerView(this.layerModel, this.leafletMap);
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
