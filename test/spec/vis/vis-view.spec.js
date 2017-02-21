var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
// required due to implicit dependency in vis --> map-view
var cdb = require('cdb');
_.extend(cdb.geo, require('../../../src/geo/leaflet'));
_.extend(cdb.geo, require('../../../src/geo/gmaps'));

var VisView = require('../../../src/vis/vis-view');
var VisModel = require('../../../src/vis/vis');
var VizJSON = require('../../../src/api/vizjson');

// extend VisView in our tests
VisView = VisView.extend({
  _getMapViewFactory: function () {
    if (!this.__mapViewFactory) {
      this.__mapViewFactory = jasmine.createSpyObj('fakeMapViewFactory', [ 'createMapView' ]);
      this.__mapViewFactory.createMapView.and.returnValue(jasmine.createSpyObj('fakeMapView', [ 'render', 'clean', 'bind' ]));
    }
    return this.__mapViewFactory;
  }
});

describe('vis/vis-view', function () {
  beforeEach(function () {
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

    this.createNewVis = function (attrs) {
      attrs.widgets = new Backbone.Collection();
      attrs.model = this.visModel;
      attrs.settingsModel = this.settingsModel;
      this.visView = new VisView(attrs);
      return this.visView;
    };

    this.createNewVis({
      el: this.container
    });

    this.visModel.load(new VizJSON(this.mapConfig));
    this.visView.render();
  });

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  describe('map provider', function () {
    beforeEach(function () {
      this.fakeMapViewFactory = this.visView._getMapViewFactory();
      this.fakeMapViewFactory.createMapView.calls.reset();

      this.visView.render();
    });

    it('should have created a LeafletMap by default', function () {
      expect(this.fakeMapViewFactory.createMapView.calls.mostRecent().args[0]).toEqual('leaflet');
    });

    it('should create a gmaps when provider changes to leaflet', function () {
      this.visModel.map.set('provider', 'something');
      this.visModel.map.set('provider', 'leaflet');

      this.visView.render();

      expect(this.fakeMapViewFactory.createMapView.calls.mostRecent().args[0]).toEqual('leaflet');
    });

    it('should create a google maps map when provider is googlemaps', function () {
      this.visModel.map.set('provider', 'something', { silent: true });
      this.visModel.map.set('provider', 'googlemaps');

      this.visView.render();

      expect(this.fakeMapViewFactory.createMapView.calls.mostRecent().args[0]).toEqual('googlemaps');
    });
  });

  it('should bind resize changes when map height is 0', function () {
    jasmine.clock().install();
    spyOn(this.visModel, 'centerMapToOrigin');

    var container = $('<div>').css('height', '0');
    var vis = this.createNewVis({ el: container });
    spyOn(vis, '_onResize').and.callThrough();

    this.visModel.load(new VizJSON(this.mapConfig));

    // Wait until view has been rendered after load
    jasmine.clock().tick(10);

    $(window).trigger('resize');

    expect(vis._onResize).toHaveBeenCalled();
    vis._onResize.calls.reset();

    jasmine.clock().tick(160);

    expect(this.visModel.centerMapToOrigin).toHaveBeenCalled();

    $(window).trigger('resize');
    expect(vis._onResize).not.toHaveBeenCalled();
  });

  it('should NOT bind resize changes when map height is greater than 0', function () {
    jasmine.clock().install();
    spyOn(this.visModel, 'centerMapToOrigin');

    var container = $('<div>').css('height', '200px');
    var vis = this.createNewVis({el: container});
    spyOn(vis, '_onResize').and.callThrough();

    this.visModel.load(new VizJSON(this.mapConfig));

    // Wait until view has been rendered after load
    jasmine.clock().tick(10);

    $(window).trigger('resize');

    expect(vis._onResize).not.toHaveBeenCalled();

    jasmine.clock().tick(160);

    expect(this.visModel.centerMapToOrigin).not.toHaveBeenCalled();
  });

  it('should display/hide the loader while loading', function () {
    this.visModel.overlaysCollection.add({
      type: 'loader'
    });

    expect(this.visView.$el.find('.CDB-Loader:not(.is-visible)').length).toEqual(1);

    this.visModel.set('loading', true);

    expect(this.visView.$el.find('.CDB-Loader.is-visible').length).toEqual(1);

    this.visModel.set('loading', false);

    expect(this.visView.$el.find('.CDB-Loader:not(.is-visible)').length).toEqual(1);
  });
});
