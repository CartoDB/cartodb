var UserLayers = require('../../../../javascripts/cartodb3/data/user-layers-collection');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');

describe('data/user-layers-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.layers = new UserLayers([{
      options: {
        visible: true,
        type: 'Tiled',
        urlTemplate: 'https://a.tiles.mapbox.com/v4/aj.um7z9lus/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpbG10dnA3NzY3OTZ0dmtwejN2ZnUycjYifQ.1W5oTOnWXQ9R1w8u3Oo1yA',
        attribution: '<a href="https://www.mapbox.com/about/maps/" target="_blank">&copy; Mapbox &copy; OpenStreetMap</a> <a class="mapbox-improve-map" href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a>',
        maxZoom: 21,
        minZoom: 0,
        name: 'MapBox Streets Outdoors Global Preview',
        order: 26
      },
      kind: 'tiled',
      infowindow: null,
      tooltip: null,
      id: 'basemap-id-1',
      order: 26
    }, {
      id: 'basemap-id-2',
      infowindow: null,
      kind: 'tiled',
      options: {
        attribution: null,
        className: 'httpsstamentilessasslfastlynetwatercolorzxyjpg',
        maxZoom: 21,
        minZoom: 0,
        name: 'Custom basemap 29',
        order: 29,
        tms: false,
        type: 'Tiled',
        urlTemplate: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
        visible: true
      },
      order: 29,
      tooltip: null
    }], {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });
  });

  describe('.getSelected', function () {
    it('should return selected layer if any', function () {
      expect(this.layers.getSelected()).toBe(undefined);
      this.layers.at(0).set('selected', true);
      expect(this.layers.getSelected().get('id')).toBe('basemap-id-1');
    });
  });

  describe('.updateSelected', function () {
    it('should update selected layer if it exists and unselect the previous if it exists', function () {
      expect(this.layers.at(0).get('selected')).toBe(undefined);
      expect(this.layers.at(1).get('selected')).toBe(undefined);
      this.layers.updateSelected('basemap-id-3');
      expect(this.layers.at(0).get('selected')).toBe(undefined);
      expect(this.layers.at(1).get('selected')).toBe(undefined);
      this.layers.updateSelected('basemap-id-1');
      expect(this.layers.at(0).get('selected')).toBe(true);
      expect(this.layers.at(1).get('selected')).toBe(undefined);
      this.layers.updateSelected('basemap-id-2');
      expect(this.layers.at(0).get('selected')).toBe(false);
      expect(this.layers.at(1).get('selected')).toBe(true);
    });
  });
});
