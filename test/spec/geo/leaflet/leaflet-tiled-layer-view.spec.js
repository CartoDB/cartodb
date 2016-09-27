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
    expect(this.layerView.options.subdomains).toEqual(['a']);
    expect(this.layerView._url).toBe('http://whatever.com');
    expect(this.layerView.options.attribution).toBe('CARTO');
    expect(this.layerView.options.errorTileUrl).toBe('http://matall.in');
    expect(this.layerView.options.maxZoom).toBe(10);
    expect(this.layerView.options.minZoom).toBe(0);
    expect(this.layerView.options.opacity).toBe(1);
    expect(this.layerView.options.tms).toBeFalsy();
  });

  describe('._modelUpdated', function () {
    beforeEach(function () {
      spyOn(this.layerView, 'setUrl').and.callThrough();
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
      expect(this.layerView.options.subdomains).toEqual(['b']);
      expect(this.layerView.options.attribution).toBe('carto');
      expect(this.layerView.options.errorTileUrl).toBe('http://matall.in');
      expect(this.layerView.options.maxZoom).toBe(12);
      expect(this.layerView.options.minZoom).toBe(1);
      expect(this.layerView.options.opacity).toBe(1);
      expect(this.layerView.options.tms).toBeTruthy();
    });

    it('should update url', function () {
      expect(this.layerView.setUrl).toHaveBeenCalled();
      expect(this.layerView._url).toBe('http://hello.com');
    });
  });
});
