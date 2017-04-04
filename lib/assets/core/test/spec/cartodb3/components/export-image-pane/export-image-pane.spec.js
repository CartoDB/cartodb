var Backbone = require('backbone');
var _ = require('underscore');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');
var ExportImagePane = require('../../../../../javascripts/cartodb3/editor/export-image-pane/export-image-pane');
var ExportImageFormModel = require('../../../../../javascripts/cartodb3/editor/export-image-pane/export-image-form-model');
var FactoryModals = require('../../factories/modals');

describe('editor/export-image-pane/export-image-pane', function () {
  beforeEach(function () {
    this._mapView = new Backbone.View();

    this._mapView.containerPointToLatLng = function (x, y) {
      return { lat: 123, lng: 456 };
    };

    this._mapView.latLngToContainerPoint = function () {
      return { x: 100, y: 20 };
    };

    window.mapView = this._mapView;

    var style = '[{ "stylers": [ { "saturation": -100 } ] },{ "featureType": "water", "stylers": [ { "gamma": 1.67 }, { "lightness": 27 } ] },{ "elementType": "geometry", "stylers": [ { "gamma": 1.31 }, { "lightness": 12 } ] },{ "featureType": "administrative", "elementType": "labels", "stylers": [ { "lightness": 51 }, { "gamma": 0.94 } ] },{ },{ "featureType": "road", "elementType": "labels", "stylers": [ { "lightness": 57 } ] },{ "featureType": "poi", "elementType": "labels", "stylers": [ { "lightness": 42 } ] }]';

    this.imageExportMetadata = {
      zoom: 10,
      mapType: 'roadmap',
      style: style,
      attribution: 'CARTO',
      provider: 'no-googlemaps',
      title: 'wadus'
    };

    this.getStaticImageURL = function () { };

    this.visDefinitionModel = new Backbone.Model();
    this.visDefinitionModel.set({
      visMetadata: this.imageExportMetadata,
      staticImageURLTemplate: this.getStaticImageURL
    });

    spyOn(this.visDefinitionModel.attributes, 'staticImageURLTemplate').and.callThrough();

    this._exportImageFormModel = new ExportImageFormModel({
      userModel: new Backbone.Model(),
      hasGoogleBasemap: false,
      format: '.png',
      x: 10,
      y: 100,
      width: 300,
      height: 200
    });

    this._configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this._userModel = new UserModel({
      username: 'perico',
      google_maps_key: 123456
    }, {
      configModel: this._configModel
    });

    this.view = new ExportImagePane({
      model: this._exportImageFormModel,
      modals: FactoryModals.createModalService(),
      mapViewClass: 'CDB-Map-wrapper',
      dashboardCanvasClass: 'CDB-Dashboard-canvas',
      canvasClassName: 'CDB-Map',
      configModel: this._configModel,
      userModel: this._userModel,
      editorModel: new Backbone.Model(),
      privacyCollection: new Backbone.Collection(),
      widgetDefinitionsCollection: new Backbone.Collection(),
      mapcapsCollection: new Backbone.Collection(),
      mapStackLayoutModel: new Backbone.Model(),
      stateDefinitionModel: new Backbone.Model(),
      stackLayoutModel: new Backbone.Model(),
      visDefinitionModel: this.visDefinitionModel
    });

    // mocks
    this.view._loadLogo = function () { return true; };
    this.view._loadAttribution = function () { return true; };

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$el.length).toBe(1);
  });

  it('should call the method to generate the image', function () {
    this.view.$('.js-ok').click();

    expect(this.visDefinitionModel.attributes.staticImageURLTemplate).toHaveBeenCalledWith({
      zoom: 10,
      width: 300,
      height: 200,
      lat: 123,
      lng: 456,
      format: 'png'
    });
  });

  describe('with google maps', function () {
    beforeEach(function () {
      this._exportImageFormModel = new ExportImageFormModel({
        userModel: new Backbone.Model(),
        hasGoogleBasemap: true,
        format: '.png',
        x: 10,
        y: 100,
        width: 300,
        height: 200
      });

      this.imageExportMetadata = _.extend({}, this.imageExportMetadata, {
        provider: 'googlemaps'
      });

      this.visDefinitionModel.set({
        visMetadata: this.imageExportMetadata
      });

      // this._vis.map.set('provider', 'googlemaps');

      this.view = new ExportImagePane({
        model: this._exportImageFormModel,
        modals: [],
        mapViewClass: 'CDB-Map-wrapper',
        dashboardCanvasClass: 'CDB-Dashboard-canvas',
        canvasClassName: 'CDB-Map',
        configModel: this._configModel,
        userModel: this._userModel,
        editorModel: new Backbone.Model(),
        privacyCollection: new Backbone.Collection(),
        widgetDefinitionsCollection: new Backbone.Collection(),
        mapcapsCollection: new Backbone.Collection(),
        mapStackLayoutModel: new Backbone.Model(),
        stateDefinitionModel: new Backbone.Model(),
        stackLayoutModel: new Backbone.Model(),
        visDefinitionModel: this.visDefinitionModel
      });

      // mocks
      this.view._loadLogo = function () { return true; };
      this.view._loadAttribution = function () { return true; };

      this.view.render();
    });

    it('should generate the gmaps url', function () {
      expect(this.view._getGMapBasemapURL()).toMatch('https:\/\/maps.googleapis.com/maps/api/staticmap\?center=123,456&zoom=10&size=300x200&mapType=roadmap&rnd=.*?&style=feature:all\|element:all\|saturation:-100\|&style=feature:water\|element:all\|gamma:1.67\|lightness:27\|&style=feature:all\|element:geometry\|gamma:1.31\|lightness:12\|&style=feature:administrative\|element:labels\|lightness:51\|gamma:0.94\|&style=feature:road\|element:labels\|lightness:57\|&style=feature:poi\|element:labels\|lightness:42\|&key=123456');
    });

    it('should call the google method to generate the image', function () {
      spyOn(this.view, '_getGMapBasemapURL').and.callThrough();

      this.view.$('.js-ok').click();
      expect(this.view._getGMapBasemapURL).toHaveBeenCalled();
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});
