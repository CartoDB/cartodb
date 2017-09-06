var _ = require('underscore');
var Backbone = require('backbone');
var OverlaysFactory = require('../../../src/vis/overlays-factory');

describe('vis/overlays-factory', function () {
  beforeEach(function () {
    this.map = new Backbone.Model();
    this.map.layers = new Backbone.Collection();

    this.mapView = new Backbone.View();
    this.mapView.map = this.map;
    this.mapView.latLngToContainerPoint = function () {
      return { x: 100, y: 200 };
    };

    this.visView = new Backbone.View();
    this.visView.mapView = this.mapView;

    this.overlaysFactory = new OverlaysFactory({
      mapModel: this.map,
      mapView: this.mapView,
      visView: this.visView
    });
  });

  it('should register and create a type', function () {
    var spy = jasmine.createSpy('spy').and.callFake(function (data, deps) {
      return {};
    });
    OverlaysFactory.register('test', spy);

    var overlay = this.overlaysFactory.create('test', { a: 'something' });
    expect(spy).toHaveBeenCalledWith({
      a: 'something',
      options: {}
    }, {
      mapModel: this.map,
      mapView: this.mapView,
      visView: this.visView
    });
    expect(overlay.type).toEqual('test');
  });

  _.each([
    { type: 'logo', data: {} },
    { type: 'attribution', data: {} },
    { type: 'zoom', data: {} },
    { type: 'loader', data: {} },
    { type: 'fullscreen', data: {} },
    { type: 'search', data: {} }
  ], function (testCase) {
    var overlayType = testCase.type;
    var overlayData = testCase.data;

    it('should create a "' + overlayType + '" overlay', function () {
      var overlay = this.overlaysFactory.create(overlayType, overlayData);
      expect(overlay).toBeDefined();
    });
  }, this);
});
