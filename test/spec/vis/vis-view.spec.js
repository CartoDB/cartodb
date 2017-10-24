var $ = require('jquery');
var Backbone = require('backbone');

var VisView = require('../../../src/vis/vis-view');
var VisModel = require('../../../src/vis/vis');
var VizJSON = require('../../../src/api/vizjson');
var Engine = require('../../../src/engine');
var MapViewFactory = require('../../../src/geo/map-view-factory');

var createVisView = function (container, visModel, settingsModel) {
  var options = {
    el: container,
    widgets: new Backbone.Collection(),
    model: visModel,
    settingsModel: settingsModel
  };

  return new VisView(options);
};

describe('vis/vis-view', function () {
  beforeEach(function () {
    spyOn(MapViewFactory, 'createMapView').and.returnValue(jasmine.createSpyObj('fakeMapView', ['render', 'clean', 'bind']));
    this.container = $('<div>').css('height', '200px');
    this.mapConfig = {
      updated_at: 'cachebuster',
      title: 'irrelevant',
      description: 'not so irrelevant',
      url: 'https://carto.com',
      center: [40.044, -101.95],
      zoom: 4,
      bounds: [
        [1, 2],
        [3, 4]
      ],
      user: {
        fullname: 'Chuck Norris',
        avatar_url: 'http://example.com/avatar.jpg'
      },
      datasource: {
        user_name: 'wadus',
        maps_api_template: 'https://{user}.example.com:443',
        stat_tag: 'ece6faac-7271-11e5-a85f-04013fc66a01'
      }
    };

    this.visModel = new VisModel();
    this.settingsModel = new Backbone.Model({
      showLegends: true,
      showLayerSelector: true
    });

    this.visView = createVisView(this.container, this.visModel, this.settingsModel);

    this.visModel.load(new VizJSON(this.mapConfig));
    this.visView.render();
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  describe('map provider', function () {
    it('should have created a LeafletMap by default', function () {
      expect(MapViewFactory.createMapView.calls.mostRecent().args[0]).toEqual('leaflet');
    });

    it('should have created a LeafletMap when map provider is "leaflet"', function () {
      this.visModel.map.set('provider', 'leaflet');
      expect(MapViewFactory.createMapView).toHaveBeenCalledWith('leaflet', jasmine.anything());
    });

    it('should have created a GoogleMap when map provider is "google"', function () {
      this.visModel.map.set('provider', 'googlemaps');
      expect(MapViewFactory.createMapView).toHaveBeenCalledWith('googlemaps', jasmine.anything());
    });
  });

  var INVALIDATE_SIZE_WAIT_IN_MS = 160;

  it('should center map to origin once when map height is 0 initially and window is resized', function () {
    jasmine.clock().install();
    spyOn(this.visModel, 'invalidateSize');

    var container = $('<div>').css('height', '0');
    this.visView = createVisView(container, this.visModel, this.settingsModel);

    this.visView.render();

    // First time the window is resized -> map is centered to origin
    $(window).trigger('resize');

    jasmine.clock().tick(INVALIDATE_SIZE_WAIT_IN_MS);

    expect(this.visModel.invalidateSize).toHaveBeenCalled();

    this.visModel.invalidateSize.calls.reset();

    // Second time the window is resized -> map is NOT centered to origin

    $(window).trigger('resize');

    jasmine.clock().tick(INVALIDATE_SIZE_WAIT_IN_MS);

    expect(this.visModel.invalidateSize).not.toHaveBeenCalled();
    jasmine.clock().uninstall();
  });

  it('should NOT center map to origin when map height is greated than O initially and window is resized', function () {
    jasmine.clock().install();
    spyOn(this.visModel, 'invalidateSize');

    var container = $('<div>').css('height', '800px');
    this.visView = createVisView(container, this.visModel, this.settingsModel);

    this.visView.render();

    // Window is resized by map is not centered since height hasn't changed
    $(window).trigger('resize');

    jasmine.clock().tick(INVALIDATE_SIZE_WAIT_IN_MS);

    expect(this.visModel.invalidateSize).not.toHaveBeenCalled();
  });

  it('should display/hide the loader while loading', function () {
    this.visModel.overlaysCollection.add({ type: 'loader' });

    expect(this.visView.$el.find('.CDB-Loader:not(.is-visible)').length).toEqual(1);

    this.visModel._engine._eventEmmitter.trigger(Engine.Events.RELOAD_STARTED);

    expect(this.visView.$el.find('.CDB-Loader.is-visible').length).toEqual(1);

    this.visModel._engine._eventEmmitter.trigger(Engine.Events.RELOAD_SUCCESS);

    expect(this.visView.$el.find('.CDB-Loader:not(.is-visible)').length).toEqual(1);
  });
});
