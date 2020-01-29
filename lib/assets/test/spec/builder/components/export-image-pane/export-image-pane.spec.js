var $ = require('jquery'); require('jquery-migrate');
var Backbone = require('backbone');
var _ = require('underscore');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var ExportImagePane = require('builder/editor/export-image-pane/export-image-pane');
var MapDefinitionModel = require('builder/data/map-definition-model');
var Notifier = require('builder/components/notifier/notifier');
var EditorModel = require('builder/data/editor-model');

var GMAPS_DIMENSION_LIMIT = 640;
var GMAPS_DIMENSION_LIMIT_PREMIUM = 2048;

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

    this.settingsCollection = new Backbone.Collection([{
      setting: 'logo',
      label: _t('editor.settings.options.logo'),
      enabled: true,
      default: false,
      enabler: false
    }]);

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
      google_maps_api_key: '123456'
    }, {
      configModel: this._configModel
    });

    this._userModel.set('actions', {
      remove_logo: false
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
      mapDefinitionModel: this.mapDefinitionModel,
      settingsCollection: this.settingsCollection
    });

    // mocks
    this.view._loadAttribution = function () { return true; };

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$el.length).toBe(1);
  });

  it('should disable button while exporting', function () {
    this.view.$('.js-ok').click();
    expect(this.view.$('.js-ok').attr('disabled')).toBe('disabled');
  });

  it('should show a disclaimer', function () {
    expect(this.view.$el.text()).toContain('disclaimer.title');
    expect(this.view.$el.text()).toContain('disclaimer.body');
  });

  it('should call the method to generate the image', function (done) {
    this.view._loadLogo = function () { return true; };

    this.view._exportImage().then(() => {
      expect(this.getStaticImageURL).toHaveBeenCalledWith({
        zoom: 10,
        width: 300,
        height: 200,
        lat: 123,
        lng: 456,
        format: 'png'
      });
      done();
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

  describe('_loadLogo', function () {
    it('calls ._getImageFromUrl', function () {
      spyOn(this.view, '_getImageFromUrl').and.callThrough();

      this.view._loadLogo();
      expect(this.view._getImageFromUrl).toHaveBeenCalled();
    });

    it('sets _logo to image and resolves the promise if there is no error', function (done) {
      // mocks
      this.view._getImageFromUrl = function () {
        var deferred = $.Deferred();
        deferred.resolve('this_is_my_logo');
        return deferred.promise();
      };

      this.view._loadLogo().then(() => {
        expect(this.view._logo).toEqual('this_is_my_logo');
        done();
      });
    });

    it('rejects the promise if there is an error', function (done) {
      spyOn(this.view, '_addErrorNotification');

      // mocks
      this.view._getImageFromUrl = function () {
        var deferred = $.Deferred();
        deferred.reject();
        return deferred.promise();
      };

      this.view._exportImage().then(() => {
        expect(this.view._addErrorNotification).toHaveBeenCalledWith('editor.maps.export-image.errors.error-image');
        done();
      });
    });
  });

  describe('disabled logo', function () {
    beforeEach(function () {
      spyOn(this.view, '_getImageFromUrl').and.callThrough();
    });

    it('can\'t remove logo', function () {
      this._userModel.get('actions').remove_logo = false;
      this.view._loadLogo();
      expect(this.view._getImageFromUrl).toHaveBeenCalled();
    });

    it('can remove logo and logo is active', function () {
      this._userModel.get('actions').remove_logo = true;
      this.settingsCollection.at(0).set('enabler', true);

      this.view._loadLogo();
      expect(this.view._getImageFromUrl).toHaveBeenCalled();
    });

    it('can remove logo and logo is not active', function () {
      this._userModel.get('actions').remove_logo = true;
      this.settingsCollection.at(0).set('enabler', false);

      this.view._loadLogo();
      expect(this.view._getImageFromUrl).not.toHaveBeenCalled();
    });
  });

  describe('_validGMapDimension', function () {
    it('should return false if dimension is bigger than limit', function () {
      this.view._exportImageFormView._formView.fields.width.setValue(641);
      this.view._exportImageFormView._formView.trigger('change');
      expect(this.view._validGMapDimension('test', GMAPS_DIMENSION_LIMIT)).toBe(false);

      this.view._exportImageFormView._formView.fields.width.setValue(300);
      this.view._exportImageFormView._formView.trigger('change');
      expect(this.view._validGMapDimension('test', GMAPS_DIMENSION_LIMIT)).toBe(true);
    });

    it('should return false if dimension is bigger than limit with premium user', function () {
      this.view._exportImageFormView._formView.fields.width.setValue(641);
      this.view._exportImageFormView._formView.trigger('change');
      expect(this.view._validGMapDimension('test', GMAPS_DIMENSION_LIMIT_PREMIUM)).toBe(true);

      this.view._exportImageFormView._formView.fields.width.setValue(2049);
      this.view._exportImageFormView._formView.trigger('change');
      expect(this.view._validGMapDimension('test&signature=foo', GMAPS_DIMENSION_LIMIT_PREMIUM)).toBe(false);

      this.view._exportImageFormView._formView.fields.width.setValue(300);
      this.view._exportImageFormView._formView.trigger('change');
      expect(this.view._validGMapDimension('test&signature=foo', GMAPS_DIMENSION_LIMIT_PREMIUM)).toBe(true);
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
        mapDefinitionModel: this.mapDefinitionModel,
        settingsCollection: this.settingsCollection
      });

      // mocks
      this.view._loadLogo = function () { return true; };
      this.view._loadAttribution = function () { return true; };

      this.view.render();
    });

    describe('._loadGMapBasemap', function () {
      beforeEach(function () {
        jasmine.Ajax.install();
      });

      it('should have been called', function (done) {
        spyOn(this.view, '_loadGMapBasemap');
        this.view._loadLogo = function () { return true; };

        this.view._exportImage().then(() => {
          expect(this.view._loadGMapBasemap).toHaveBeenCalled();
          done();
        });
      });

      describe('when request success', function () {
        beforeEach(function () {
          jasmine.Ajax.stubRequest(new RegExp('^/u/pepe')).andReturn({
            status: 200,
            contentType: 'application/json; charset=utf-8',
            responseText: '{ "url": "http://mockedgoogleurl.com/staticmap" }'
          });
        });

        it('sets _basemap to image and resolves the promise if there is no error', function (done) {
          // mocks
          this.view._getImageFromUrl = function () {
            var deferred = $.Deferred();
            deferred.resolve('this_is_a_static_map_url');
            return deferred.promise();
          };

          this.view._loadGMapBasemap().then(() => {
            expect(this.view._basemap).toEqual('this_is_a_static_map_url');
            done();
          });
        });

        it('rejects the promise if there is an error', function (done) {
          spyOn(this.view, '_addErrorNotification');

          // mocks
          this.view._getImageFromUrl = function () {
            var deferred = $.Deferred();
            deferred.reject();
            return deferred.promise();
          };

          this.view._exportImage().then(() => {
            expect(this.view._addErrorNotification).toHaveBeenCalledWith('editor.maps.export-image.errors.error-basemap');
            done();
          });
        });

        it('rejects the promise if validation fails', function (done) {
          spyOn(this.view, '_addErrorNotification');
          this.view._exportImageFormView._formView.fields.width.setValue(646);
          this.view._exportImageFormView._formView.trigger('change');

          this.view._exportImage().then(() => {
            expect(this.view._addErrorNotification).toHaveBeenCalledWith('editor.export-image.invalid-dimension');
            done();
          });
        });
      });

      describe('when request fails', function () {
        it('returns an error', function (done) {
          jasmine.Ajax.stubRequest(new RegExp('^/u/pepe')).andReturn({
            status: 400
          });
          spyOn(this.view, '_addErrorNotification');

          this.view._exportImage().then(() => {
            expect(this.view._addErrorNotification).toHaveBeenCalledWith('editor.maps.export-image.errors.error-basemap');
            done();
          });
        });
      });

      afterEach(function () {
        jasmine.Ajax.uninstall();
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
        mapDefinitionModel: this.mapDefinitionModel,
        settingsCollection: this.settingsCollection
      });

      // mocks
      this.view._loadLogo = function () {
        var deferred = $.Deferred();
        deferred.reject(_t('editor.maps.export-image.errors.error-attribution'));
        return deferred.promise();
      };

      this.view.render();
    });

    it('should show notification', function (done) {
      Notifier.getCollection().reset([]);

      this.view._exportImage().then(() => {
        expect(Notifier.getCollection().length).toBe(1);
        done();
      });
    });
  });

  it('should turn &copy; into ©', function () {
    var attr = this.view._parseAttribution(['&copy; © memes should be above copyright law © &copy;']);

    expect(attr).not.toContain('&copy;');
    expect((attr.match(/©/g) || []).length).toBe(4);
  });

  afterEach(function () {
    Notifier.off();
    this.view.remove();
  });
});
