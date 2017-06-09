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
      google_maps_api_key: '123456'
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

  it('should call the method to generate the image', function () {
    this.view._loadLogo = function () { return true; };

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

  describe('_loadLogo', function () {
    it('calls ._getImageFromUrl', function () {
      spyOn(this.view, '_getImageFromUrl').and.callThrough();

      this.view.$('.js-ok').click();
      expect(this.view._getImageFromUrl).toHaveBeenCalled();
    });

    it('sets _logo to image and resolves the promise if there is no error', function () {
      // mocks
      this.view._getImageFromUrl = function () {
        var deferred = $.Deferred();
        deferred.resolve('this_is_my_logo');
        return deferred.promise();
      };

      this.view.$('.js-ok').click();
      expect(this.view._logo).toEqual('this_is_my_logo');
    });

    it('rejects the promise if there is an error', function () {
      spyOn(this.view, '_addErrorNotification');

        // mocks
      this.view._getImageFromUrl = function () {
        var deferred = $.Deferred();
        deferred.reject();
        return deferred.promise();
      };

      this.view.$('.js-ok').click();
      expect(this.view._addErrorNotification).toHaveBeenCalledWith('editor.maps.export-image.errors.error-image');
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

    xdescribe('_getImageFromUrl', function () {
      it('resolves the promise if the image loads', function () {
        this.view._getImageFromUrl('data:image/png;base64,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');
        expect(this.deferredMock.resolve).toHaveBeenCalled();
      });

      it('rejects the promise if there is an error', function () {
        this.view._getImageFromUrl('test');
        expect(this.deferredMock.reject).toHaveBeenCalled();
      });
    });

    describe('._loadGMapBasemap', function () {
      beforeEach(function () {
        jasmine.Ajax.install();
      });

      it('should have been called', function () {
        spyOn(this.view, '_loadGMapBasemap');

        this.view.$('.js-ok').click();
        expect(this.view._loadGMapBasemap).toHaveBeenCalled();
      });

      describe('when request succees', function () {
        beforeEach(function () {
          jasmine.Ajax.stubRequest(new RegExp('^http(s)?://')).andReturn({
            status: 200,
            contentType: 'application/json; charset=utf-8',
            responseText: '{ "url": "http://mockedgoogleurl.com/staticmap" }'
          });
        });

        it('calls ._getImageFromUrl', function () {
          spyOn(this.view, '_getImageFromUrl');

          this.view.$('.js-ok').click();
          expect(this.view._getImageFromUrl).toHaveBeenCalled();
        });

        it('sets _basemap to image and resolves the promise if there is no error', function () {
           // mocks
          this.view._getImageFromUrl = function () {
            var deferred = $.Deferred();
            deferred.resolve('this_is_a_static_map_url');
            return deferred.promise();
          };

          this.view.$('.js-ok').click();
          expect(this.view._basemap).toEqual('this_is_a_static_map_url');
        });

        it('rejects the promise if there is an error', function () {
          spyOn(this.view, '_addErrorNotification');

           // mocks
          this.view._getImageFromUrl = function () {
            var deferred = $.Deferred();
            deferred.reject();
            return deferred.promise();
          };

          this.view.$('.js-ok').click();
          expect(this.view._addErrorNotification).toHaveBeenCalledWith('editor.maps.export-image.errors.error-basemap');
        });
      });

      describe('when request fails', function () {
        it('returns an error', function () {
          jasmine.Ajax.stubRequest(new RegExp('^http(s)?://')).andReturn({
            status: 400
          });
          spyOn(this.view, '_addErrorNotification');

          this.view.$('.js-ok').click();
          expect(this.view._addErrorNotification).toHaveBeenCalledWith('editor.maps.export-image.errors.error-basemap');
        });
      });

      afterEach(function () {
        jasmine.Ajax.uninstall();
      });
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
        this.view._exportImageFormModel._userModel.set({google_maps_api_key: 'signature=foo'});
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
