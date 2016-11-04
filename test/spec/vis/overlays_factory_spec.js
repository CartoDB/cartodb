var _ = require('underscore');
var Backbone = require('backbone');
var OverlaysFactory = require('../../../src/vis/overlays-factory');

describe('vis/overlays-factory', function () {
  var createFakeLayerView = function () {
    var view = new Backbone.View();
    return view;
  };

  beforeEach(function () {
    this.map = new Backbone.Model();
    this.map.layers = new Backbone.Collection();
    this.mapView = new Backbone.View();
    this.mapView.map = this.map;
    this.visView = new Backbone.View();
    this.visView.mapView = this.mapView;
    this.visView.getLayerViews = function () {
      return [ createFakeLayerView(), createFakeLayerView() ];
    };
  });

  it('should register and create a type', function () {
    OverlaysFactory.register('test', function (data, visView, map) {
      return {
        data: data,
        visView: visView,
        map: map
      };
    });

    var overlay = OverlaysFactory.create('test', { a: 'something' }, {
      visView: 'visView',
      map: 'map'
    });
    expect(overlay).toEqual({
      data: {
        a: 'something',
        options: { }
      },
      visView: 'visView',
      map: 'map',
      type: 'test'
    });
  });

  _.each([
    { type: 'logo', data: {} },
    { type: 'attribution', data: {} },
    { type: 'text', data: { options: { extra: { rendered_text: 'something' } } } },
    { type: 'annotation', data: { options: { extra: { rendered_text: 'something' }, style: {} } } },
    { type: 'header', data: { options: { extra: { } } } },
    { type: 'zoom', data: {} },
    { type: 'loader', data: {} },
    { type: 'fullscreen', data: {} },
    { type: 'share', data: {} },
    { type: 'search', data: {} }
  ], function (testCase) {
    var overlayType = testCase.type;
    var overlayData = testCase.data;

    it('should create a "' + overlayType + '" overlay', function () {
      var overlay = OverlaysFactory.create(overlayType, overlayData, {
        visView: this.visView,
        map: this.map
      });
      expect(overlay).toBeDefined();
    });
  }, this);
});
