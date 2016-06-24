var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var View = require('../../../src/core/view');
// required due to implicit dependency in vis --> map-view
var cdb = require('cdb');
_.extend(cdb.geo, require('../../../src/geo/leaflet'));
_.extend(cdb.geo, require('../../../src/geo/gmaps'));

var Overlay = require('../../../src/vis/vis/overlay');
var VisView = require('../../../src/vis/vis-view');
var VisModel = require('../../../src/vis/vis');
var VizJSON = require('../../../src/api/vizjson');

require('../../../src/vis/overlays'); // Overlay.register calls
require('../../../src/vis/layers'); // Layers.register calls

describe('vis/vis-view', function () {
  beforeEach(function () {
    this.container = $('<div>').css('height', '200px');
    this.mapConfig = {
      updated_at: 'cachebuster',
      title: 'irrelevant',
      description: 'not so irrelevant',
      url: 'http://cartodb.com',
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
        stat_tag: 'ece6faac-7271-11e5-a85f-04013fc66a01',
        force_cors: true // This is sometimes set in the editor
      }
    };

    this.visModel = new VisModel();

    this.createNewVis = function (attrs) {
      attrs.widgets = new Backbone.Collection();
      attrs.model = this.visModel;
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

  it('should create a leaflet map when provider is leaflet', function () {
    this.visModel.map.set('provider', 'leaflet');

    this.visView.render();

    expect(this.visView.mapView._leafletMap).not.toEqual(undefined);
  });

  it('should create a google maps map when provider is googlemaps', function () {
    this.visModel.map.set('provider', 'googlemaps');

    this.visView.render();

    expect(this.visView.mapView._gmapsMap).not.toEqual(undefined);
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
    this.visView.addOverlay({
      type: 'loader'
    });

    this.visModel.set('loading', true);

    expect(this.visView.$el.find('.CDB-Loader.is-visible').length).toEqual(1);

    this.visModel.set('loading', false);

    expect(this.visView.$el.find('.CDB-Loader:not(.is-visible)').length).toEqual(1);
  });

  describe('.getLayerViews', function () {
    it('should return the layerViews', function () {
      this.mapConfig.layers = [{
        type: 'tiled',
        options: {
          urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
        }
      }];
      this.visModel.load(new VizJSON(this.mapConfig));
      expect(this.visView.getLayerViews().length).toBe(1);
    });
  });

  describe('Legends', function () {
    beforeEach(function () {
      this.mapConfig.layers = [
        {
          type: 'tiled',
          legend: {
            type: 'custom',
            show_title: false,
            title: '',
            template: '',
            items: [
              {
                name: 'visible legend item',
                visible: true,
                value: '#cccccc',
                sync: true
              }
            ]
          },
          options: {
            urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
          }
        },
        {
          visible: false,
          type: 'tiled',
          legend: {
            type: 'custom',
            show_title: false,
            title: '',
            template: '',
            items: [
              {
                name: 'invisible legend item',
                visible: true,
                value: '#cccccc',
                sync: true
              }
            ]
          },
          options: {
            urlTemplate: 'https://dnv9my2eseobd.cloudfront.net/v3/{z}/{x}/{y}.png'
          }
        }
      ];
      this.visModel.load(new VizJSON(this.mapConfig));
    });

    it('should NOT display legend if showLegends is false', function () {
      this.visModel.set('showLegends', false);

      this.visView.render();

      expect(this.visView.$('.cartodb-legend').length).toEqual(0);
    });

    it('should only display legends for visible layers if showLegends is true', function () {
      this.visModel.set('showLegends', true);

      this.visView.render();

      expect(this.visView.$('.cartodb-legend').length).toEqual(1);
      expect(this.visView.$el.html()).toContain('visible legend item');
      expect(this.visView.$el.html()).not.toContain('invisible legend item');
    });
  });

  describe('.getOverlaysByType', function () {
    it('should retrieve the overlays of a given type', function () {
      Overlay.register('wadus', function (data, vis) {
        return new View();
      });

      var tooltip1 = this.visView.addOverlay({
        type: 'wadus'
      });
      var tooltip2 = this.visView.addOverlay({
        type: 'wadus'
      });
      var tooltip3 = this.visView.addOverlay({
        type: 'wadus'
      });
      var tooltips = this.visView.getOverlaysByType('wadus');
      expect(tooltips.length).toEqual(3);
      expect(tooltips[0]).toEqual(tooltip1);
      expect(tooltips[1]).toEqual(tooltip2);
      expect(tooltips[2]).toEqual(tooltip3);
      tooltip1.clean();
      tooltip2.clean();
      tooltip3.clean();
      expect(this.visView.getOverlaysByType('wadus').length).toEqual(0);
    });
  });

  describe('.addOverlay', function () {
    it('should throw an error if no layers are available', function () {
      expect(function () {
        this.visView.addOverlay({
          type: 'tooltip',
          template: 'test'
        });
      }.bind(this)).toThrow(new Error('layer is null'));
    });

    it('should add an overlay to the specified layer and enable interaction', function () {
      var FakeLayer = function () {};
      FakeLayer.prototype.setInteraction = function () {};
      _.extend(FakeLayer.prototype, Backbone.Events);

      var layer = new FakeLayer();

      var tooltip = this.visView.addOverlay({
        type: 'tooltip',
        template: 'test',
        layer: layer
      });

      expect(tooltip.options.layer).toEqual(layer);
    });

    it('should add an overlay to the first layer and enable interaction', function () {
      var vizjson = {
        layers: [
          {
            type: 'tiled',
            options: {
              urlTemplate: ''
            }
          },
          {
            type: 'layergroup',
            options: {
              user_name: 'pablo',
              maps_api_template: 'https://{user}.cartodb-staging.com:443',
              layer_definition: {
                stat_tag: 'ece6faac-7271-11e5-a85f-04013fc66a01',
                layers: [{
                  type: 'CartoDB'
                }]
              }
            }
          }
        ],
        user: {
          fullname: 'Chuck Norris',
          avatar_url: 'http://example.com/avatar.jpg'
        },
        datasource: {
          user_name: 'wadus',
          maps_api_template: 'https://{user}.example.com:443',
          stat_tag: 'ece6faac-7271-11e5-a85f-04013fc66a01',
          force_cors: true // This is sometimes set in the editor
        }
      };

      this.visModel.load(new VizJSON(vizjson));
      var tooltip = this.visView.addOverlay({
        type: 'tooltip',
        template: 'test'
      });

      var layerView = this.visView.getLayerViews()[1];

      expect(tooltip.options.layer).toEqual(layerView);
    });
  });
});
