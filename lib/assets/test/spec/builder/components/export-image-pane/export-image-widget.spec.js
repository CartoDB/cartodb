var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var ExportImageWidget = require('builder/editor/export-image-pane/export-image-widget');
var ExportImageFormModel = require('builder/editor/export-image-pane/export-image-form-model');
var MapDefinitionModel = require('builder/data/map-definition-model');
var TRACK_CONTEXT_CLASS = 'track-ImageExport';

describe('editor/export-image-pane/export-image-widget', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/wadus'
    });

    this.userModel = new UserModel({
      username: 'foo',
      google_maps_api_key: 123456
    }, {
      configModel: this.configModel
    });

    this.mapDefinitionModel = new MapDefinitionModel({
      scrollwheel: false
    }, {
      parse: true,
      configModel: this.configModel,
      userModel: this.userModel,
      layerDefinitionsCollection: new Backbone.Collection()
    });

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

    this.stateDefinitionModel = new Backbone.Model({
      json: {
        map: {
          zoom: 10,
          center: [1, 55]
        }
      }
    });

    this._exportImageFormModel = new ExportImageFormModel({
      userModel: new Backbone.Model(),
      hasGoogleBasemap: false,
      format: '.png',
      x: 10,
      y: 100,
      width: 300,
      height: 200
    });

    this.view = new ExportImageWidget({
      model: this._exportImageFormModel,
      mapViewClass: 'CDB-Map-wrapper',
      dashboardCanvasClass: 'CDB-Dashboard-canvas',
      stateDefinitionModel: this.stateDefinitionModel,
      mapDefinitionModel: this.mapDefinitionModel
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-canvas').length).toBe(1);
  });

  it('should setup the canvas', function () {
    expect(this.view.$('.js-canvas').css('width')).toBe('300px');
    expect(this.view.$('.js-canvas').css('height')).toBe('200px');
    expect(this.view.$('.js-canvas').css('top')).toBe('100px');
    expect(this.view.$('.js-canvas').css('left')).toBe('10px');
  });

  it('should have tracking classes', function () {
    expect(this.view.$('.js-canvas .ui-resizable-nw').hasClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeTopLeft')).toBeTruthy();
    expect(this.view.$('.js-canvas .ui-resizable-n').hasClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeTopCenter')).toBeTruthy();
    expect(this.view.$('.js-canvas .ui-resizable-ne').hasClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeTopRight')).toBeTruthy();
    expect(this.view.$('.js-canvas .ui-resizable-w').hasClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeMiddleLeft')).toBeTruthy();
    expect(this.view.$('.js-canvas .ui-resizable-e').hasClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeMiddleCenter')).toBeTruthy();
    expect(this.view.$('.js-canvas .ui-resizable-sw').hasClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeBottomLeft')).toBeTruthy();
    expect(this.view.$('.js-canvas .ui-resizable-s').hasClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeBottomCenter')).toBeTruthy();
    expect(this.view.$('.js-canvas .ui-resizable-se').hasClass(TRACK_CONTEXT_CLASS + ' ' + 'track-nodeBottomRight')).toBeTruthy();
  });

  it('should update the coordinates', function () {
    this.view._updateCoordinates(5, 500, 40, 50);
    expect(this._exportImageFormModel.get('x')).toEqual(5);
    expect(this._exportImageFormModel.get('y')).toEqual(500);
    expect(this._exportImageFormModel.get('width')).toEqual(40);
    expect(this._exportImageFormModel.get('height')).toEqual(50);
  });

  it('should update coordinates on state changes', function () {
    spyOn(this.view, '_calcCenter').and.callThrough();
    this.stateDefinitionModel.set('json', {
      map: {
        zoom: 4
      }
    });

    expect(this.view._calcCenter).toHaveBeenCalled();
  });

  afterEach(function () {
    this.view.remove();
  });
});
