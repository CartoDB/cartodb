var VizJSON = require('../../../src/api/vizjson');

describe('src/vis/vizjson', function () {
  it('should expose the vizjson attributes', function () {
    var vizjson = new VizJSON({
      key1: 'value1',
      key2: 'value2'
    });

    expect(vizjson.key1).toEqual('value1');
    expect(vizjson.key2).toEqual('value2');
  });

  it('should have an attribution overlay by default', function () {
    var vizjson = new VizJSON({});

    expect(vizjson.getOverlayByType(VizJSON.OVERLAY_TYPES.ATTRIBUTION)).toEqual({
      type: VizJSON.OVERLAY_TYPES.ATTRIBUTION
    });
  });

  describe('.hasZoomOverlay', function () {
    it("should return true if there's a zoom overlay", function () {
      var vizjson = new VizJSON({
        overlays: [{
          type: VizJSON.OVERLAY_TYPES.ZOOM
        }]
      });

      expect(vizjson.hasZoomOverlay()).toBeTruthy();
    });
  });

  describe('.hasOverlay', function () {
    it("should return true if there's an overlay with the given type", function () {
      var vizjson = new VizJSON({
        overlays: [{
          type: 'something'
        }]
      });

      expect(vizjson.hasOverlay('something')).toBeTruthy();
    });

    it("should return false if there isn't an overlay with the given type", function () {
      var vizjson = new VizJSON({
        overlays: [{
          type: 'something'
        }]
      });

      expect(vizjson.hasOverlay('else')).toBeFalsy();
    });
  });

  describe('.getOverlayByType', function () {
    it("should return the overlay if there's an overlay with the given type", function () {
      var vizjson = new VizJSON({
        overlays: [{
          type: 'something'
        }]
      });

      expect(vizjson.getOverlayByType('something')).toEqual({
        type: 'something'
      });
    });

    it("should return nothing if there isn't an overlay with the given type", function () {
      var vizjson = new VizJSON({
        overlays: [{
          type: 'something'
        }]
      });

      expect(vizjson.getOverlayByType('else')).toBeUndefined();
    });
  });

  describe('.addHeaderOverlay', function () {
    it('should add a header Overlay', function () {
      var vizjson = new VizJSON({
        url: 'http://cartodb.com',
        title: 'title',
        description: 'description'
      });

      vizjson.addHeaderOverlay('show_title', 'show_description', 'is_shareable');

      expect(vizjson.getOverlayByType('header')).toEqual({
        type: 'header',
        order: 1,
        shareable: 'is_shareable',
        url: 'http://cartodb.com',
        options: {
          extra: {
            title: 'title',
            description: 'description',
            show_title: 'show_title',
            show_description: 'show_description'
          }
        }
      });
    });
  });

  describe('.addLayerSelectorOverlay', function () {
    it('should add a layer selector Overlay', function () {
      var vizjson = new VizJSON({});

      vizjson.addLayerSelectorOverlay();

      expect(vizjson.getOverlayByType('layer_selector')).toEqual({
        type: 'layer_selector'
      });
    });
  });

  describe('.addSearchOverlay', function () {
    it('should add a search overlay', function () {
      var vizjson = new VizJSON({});

      vizjson.addSearchOverlay();

      expect(vizjson.getOverlayByType('search')).toEqual({
        type: 'search',
        order: 3
      });
    });
  });

  describe('.removeOverlay', function () {
    it('should remove the overlay of the given type', function () {
      var vizjson = new VizJSON({
        overlays: [{
          type: 'something'
        }]
      });

      expect(vizjson.getOverlayByType('something')).toBeDefined();

      vizjson.removeOverlay('something');

      expect(vizjson.getOverlayByType('something')).not.toBeDefined();
    });
  });

  describe('.removeLoaderOverlay', function () {
    it('should remove the loader overlay', function () {
      var vizjson = new VizJSON({
        overlays: [{
          type: VizJSON.OVERLAY_TYPES.LOADER
        }]
      });

      expect(vizjson.getOverlayByType(VizJSON.OVERLAY_TYPES.LOADER)).toBeDefined();

      vizjson.removeLoaderOverlay();

      expect(vizjson.getOverlayByType(VizJSON.OVERLAY_TYPES.LOADER)).not.toBeDefined();
    });
  });

  describe('.removeZoomOverlay', function () {
    it('should remove the zoom overlay', function () {
      var vizjson = new VizJSON({
        overlays: [{
          type: VizJSON.OVERLAY_TYPES.ZOOM
        }]
      });

      expect(vizjson.getOverlayByType(VizJSON.OVERLAY_TYPES.ZOOM)).toBeDefined();

      vizjson.removeZoomOverlay();

      expect(vizjson.getOverlayByType(VizJSON.OVERLAY_TYPES.ZOOM)).not.toBeDefined();
    });
  });

  describe('.removeSearchOverlay', function () {
    it('should remove the search overlay', function () {
      var vizjson = new VizJSON({
        overlays: [{
          type: VizJSON.OVERLAY_TYPES.SEARCH
        }]
      });

      expect(vizjson.getOverlayByType(VizJSON.OVERLAY_TYPES.SEARCH)).toBeDefined();

      vizjson.removeSearchOverlay();

      expect(vizjson.getOverlayByType(VizJSON.OVERLAY_TYPES.SEARCH)).not.toBeDefined();
    });
  });

  describe('.enforceGMapsBaseLayer', function () {
    it('should replace the existing base layer by a GMaps one', function () {
      var vizjson = new VizJSON({
        map_provider: VizJSON.MAP_PROVIDER_TYPES.LEAFLET,
        layers: [{
          options: {
            type: 'Tiled',
            url: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
            name: 'Positron',
            className: 'httpsbasemapscartocdncomlight_nolabelszxypng',
            attribution: '&copy; <a href=\'http://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors &copy; <a href= \'http://cartodb.com/attributions\'>CartoDB</a>',
            urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
          }
        }]
      });

      vizjson.enforceGMapsBaseLayer('roadmap', { color: 'blue' });

      expect(vizjson.layers[0]).toEqual({
        options: {
          type: 'GMapsBase',
          url: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
          name: 'roadmap',
          className: 'httpsbasemapscartocdncomlight_nolabelszxypng',
          attribution: '',
          urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
          base_type: 'roadmap',
          style: {color: 'blue'}
        }
      });
      expect(vizjson.map_provider).toEqual(VizJSON.MAP_PROVIDER_TYPES.GMAPS);
    });

    it('should NOT replace the existing base layer by a GMaps one if map_provider is not leaflet', function () {
      var vizjson = new VizJSON({
        map_provider: 'something',
        layers: [{
          options: {
            type: 'Tiled',
            url: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
            name: 'Positron',
            className: 'httpsbasemapscartocdncomlight_nolabelszxypng',
            attribution: '&copy; <a href=\'http://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors &copy; <a href= \'http://cartodb.com/attributions\'>CartoDB</a>',
            urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
          }
        }]
      });

      vizjson.enforceGMapsBaseLayer('roadmap', { color: 'blue' });

      expect(vizjson.layers[0]).toEqual({
        options: {
          type: 'Tiled',
          url: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
          name: 'Positron',
          className: 'httpsbasemapscartocdncomlight_nolabelszxypng',
          attribution: '&copy; <a href=\'http://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors &copy; <a href= \'http://cartodb.com/attributions\'>CartoDB</a>',
          urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
        }
      });

      expect(vizjson.map_provider).toEqual('something');
    });

    it('should NOT replace the existing base layer by a GMaps one if the given type is not valid', function () {
      var vizjson = new VizJSON({
        map_provider: VizJSON.MAP_PROVIDER_TYPES.LEAFLET,
        layers: [{
          options: {
            type: 'Tiled',
            url: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
            name: 'Positron',
            className: 'httpsbasemapscartocdncomlight_nolabelszxypng',
            attribution: '&copy; <a href=\'http://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors &copy; <a href= \'http://cartodb.com/attributions\'>CartoDB</a>',
            urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
          }
        }]
      });

      vizjson.enforceGMapsBaseLayer('invalid type', { color: 'blue' });

      expect(vizjson.layers[0]).toEqual({
        options: {
          type: 'Tiled',
          url: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
          name: 'Positron',
          className: 'httpsbasemapscartocdncomlight_nolabelszxypng',
          attribution: '&copy; <a href=\'http://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors &copy; <a href= \'http://cartodb.com/attributions\'>CartoDB</a>',
          urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
        }
      });

      expect(vizjson.map_provider).toEqual(VizJSON.MAP_PROVIDER_TYPES.LEAFLET);
    });
  });

  describe('.setZoom', function () {
    it('should set a new zoom and unset bounds', function () {
      var vizjson = new VizJSON({
        zoom: 'old_zoom',
        bounds: 'bounds'
      });

      vizjson.setZoom('new_zoom');

      expect(vizjson.zoom).toEqual('new_zoom');
      expect(vizjson.bounds).toBeNull();
    });
  });

  describe('.setCenter', function () {
    it('should set a new center and unset bounds', function () {
      var vizjson = new VizJSON({
        center: 'old_center',
        bounds: 'bounds'
      });

      vizjson.setCenter('new_center');

      expect(vizjson.center).toEqual('new_center');
      expect(vizjson.bounds).toBeNull();
    });
  });

  describe('.setBounds', function () {
    it('should set bounds', function () {
      var vizjson = new VizJSON({
        bounds: 'old_bounds'
      });

      vizjson.setBounds('new_bounds');

      expect(vizjson.bounds).toEqual('new_bounds');
    });
  });
});
