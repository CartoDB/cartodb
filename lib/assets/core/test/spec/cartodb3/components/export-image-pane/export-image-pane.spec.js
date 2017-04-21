var $ = require('jquery');
var Backbone = require('backbone');
var _ = require('underscore');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');
var ExportImagePane = require('../../../../../javascripts/cartodb3/editor/export-image-pane/export-image-pane');
var MapDefinitionModel = require('../../../../../javascripts/cartodb3/data/map-definition-model');
var Notifier = require('../../../../../javascripts/cartodb3/components/notifier/notifier');
var EditorModel = require('../../../../../javascripts/cartodb3/data/editor-model');

describe('editor/export-image-pane/export-image-pane', function () {
  beforeEach(function () {
    var style = '[{ "stylers": [ { "saturation": -100 } ] },{ "featureType": "water", "stylers": [ { "gamma": 1.67 }, { "lightness": 27 } ] },{ "elementType": "geometry", "stylers": [ { "gamma": 1.31 }, { "lightness": 12 } ] },{ "featureType": "administrative", "elementType": "labels", "stylers": [ { "lightness": 51 }, { "gamma": 0.94 } ] },{ },{ "featureType": "road", "elementType": "labels", "stylers": [ { "lightness": 57 } ] },{ "featureType": "poi", "elementType": "labels", "stylers": [ { "lightness": 42 } ] }]';

    this.imageExportMetadata = {
      zoom: 10,
      mapType: 'roadmap',
      style: style,
      attribution: 'CARTO',
      provider: 'no-googlemaps',
      title: 'wadus'
    };

    this.getStaticImageURL = jasmine.createSpy('getStaticImageURL');

    this.visDefinitionModel = new Backbone.Model({
      name: 'foo'
    });

    Notifier.init({
      editorModel: new EditorModel(),
      visDefinitionModel: new Backbone.Model()
    });

    this._configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this._userModel = new UserModel({
      username: 'perico',
      google_maps_key: '123456'
    }, {
      configModel: this._configModel
    });

    this.mapDefinitionModel = new MapDefinitionModel({
      scrollwheel: false
    }, {
      parse: true,
      configModel: this._configModel,
      userModel: this._userModel,
      layerDefinitionsCollection: new Backbone.Collection()
    });

    this.mapDefinitionModel.setImageExportMetadata(this.imageExportMetadata);

    spyOn(this.mapDefinitionModel, 'getStaticImageURLTemplate').and.returnValue(this.getStaticImageURL);
    spyOn(this.mapDefinitionModel, 'getMapViewSize').and.returnValue({
      x: 100,
      y: 100
    });

    this.mapDefinitionModel.pixelToLatLng = function (x, y) {
      return { lat: 123, lng: 456 };
    };

    this.mapDefinitionModel.latLngToPixel = function () {
      return { x: 100, y: 20 };
    };

    this.view = new ExportImagePane({
      canvasClassName: 'CDB-Map',
      configModel: this._configModel,
      userModel: this._userModel,
      stackLayoutModel: new Backbone.Collection(),
      editorModel: new Backbone.Model(),
      privacyCollection: new Backbone.Collection(),
      widgetDefinitionsCollection: new Backbone.Collection(),
      mapcapsCollection: new Backbone.Collection(),
      mapStackLayoutModel: new Backbone.Model(),
      stateDefinitionModel: new Backbone.Model(),
      visDefinitionModel: this.visDefinitionModel,
      mapDefinitionModel: this.mapDefinitionModel
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

    expect(this.getStaticImageURL).toHaveBeenCalledWith({
      zoom: 10,
      width: 300,
      height: 200,
      lat: 123,
      lng: 456,
      format: 'png'
    });
  });

  describe('validation', function () {
    it('should disable save button if validation error', function () {
      this.view._exportImageFormView._formView.fields.width.setValue(30000);
      this.view._exportImageFormView._formView.trigger('change');
      expect(this.view.$('.js-ok').attr('disabled')).toBe('disabled');

      this.view._exportImageFormView._formView.fields.width.setValue(300);
      this.view._exportImageFormView._formView.trigger('change');
      expect(this.view.$('.js-ok').attr('disabled')).toBeUndefined();
    });

    it('should validate when dimensions change manually', function () {
      this.view._exportImageFormView._formView.fields.width.setValue(30000);
      this.view._exportImageFormView._formView.trigger('change');
      expect(this.view.$('.js-ok').attr('disabled')).toBe('disabled');

      this.view._exportImageFormView._formModel.set('width', 315);
      expect(this.view.$('.js-ok').attr('disabled')).toBeUndefined();
    });
  });

  describe('with google maps', function () {
    beforeEach(function () {
      this.mapDefinitionModel.setImageExportMetadata(_.extend({}, this.imageExportMetadata, {
        provider: 'googlemaps'
      }));

      this.view = new ExportImagePane({
        canvasClassName: 'CDB-Map',
        configModel: this._configModel,
        userModel: this._userModel,
        stackLayoutModel: new Backbone.Collection(),
        editorModel: new Backbone.Model(),
        privacyCollection: new Backbone.Collection(),
        widgetDefinitionsCollection: new Backbone.Collection(),
        mapcapsCollection: new Backbone.Collection(),
        mapStackLayoutModel: new Backbone.Model(),
        stateDefinitionModel: new Backbone.Model(),
        visDefinitionModel: this.visDefinitionModel,
        mapDefinitionModel: this.mapDefinitionModel
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

    describe('validation', function () {
      it('should disable save button if validation error', function () {
        this.view._exportImageFormView._formView.fields.width.setValue(641);
        this.view._exportImageFormView._formView.trigger('change');
        expect(this.view.$('.js-ok').attr('disabled')).toBe('disabled');

        this.view._exportImageFormView._formView.fields.width.setValue(300);
        this.view._exportImageFormView._formView.trigger('change');
        expect(this.view.$('.js-ok').attr('disabled')).toBeUndefined();
      });

      it('should disable save button if validation error with premium user', function () {
        this.view._exportImageFormModel._userModel.set({google_maps_key: 'signature=foo'});
        this.view._exportImageFormView._formView.fields.width.setValue(641);
        this.view._exportImageFormView._formView.trigger('change');
        expect(this.view.$('.js-ok').attr('disabled')).toBeUndefined();

        this.view._exportImageFormView._formView.fields.width.setValue(2049);
        this.view._exportImageFormView._formView.trigger('change');
        expect(this.view.$('.js-ok').attr('disabled')).toBe('disabled');

        this.view._exportImageFormView._formView.fields.width.setValue(300);
        this.view._exportImageFormView._formView.trigger('change');
        expect(this.view.$('.js-ok').attr('disabled')).toBeUndefined();
      });
    });
  });

  describe('with errors', function () {
    beforeEach(function () {
      this.mapDefinitionModel.setImageExportMetadata(_.extend({}, this.imageExportMetadata, {
        provider: 'googlemaps'
      }));

      this.view = new ExportImagePane({
        canvasClassName: 'CDB-Map',
        configModel: this._configModel,
        userModel: this._userModel,
        stackLayoutModel: new Backbone.Collection(),
        editorModel: new Backbone.Model(),
        privacyCollection: new Backbone.Collection(),
        widgetDefinitionsCollection: new Backbone.Collection(),
        mapcapsCollection: new Backbone.Collection(),
        mapStackLayoutModel: new Backbone.Model(),
        stateDefinitionModel: new Backbone.Model(),
        visDefinitionModel: this.visDefinitionModel,
        mapDefinitionModel: this.mapDefinitionModel
      });

      // mocks
      this.view._loadLogo = function () {
        var deferred = $.Deferred();
        deferred.reject(_t('editor.maps.export-image.errors.error-attribution'));
        return deferred.promise();
      };

      this.view.render();
    });

    it('should show notification', function () {
      Notifier.getCollection().reset([]);
      this.view.$('.js-ok').click();
      expect(Notifier.getCollection().length).toBe(1);
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});
