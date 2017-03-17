var Backbone = require('backbone');
var ExportImageWidget = require('../../../../../javascripts/cartodb3/editor/export-image-pane/export-image-widget');
var ExportImageFormModel = require('../../../../../javascripts/cartodb3/editor/export-image-pane/export-image-form-model');
var TRACK_CONTEXT_CLASS = 'track-DO';

fdescribe('editor/export-image-pane/export-image-widget', function () {
  beforeEach(function () {
    window.mapView = new Backbone.View();
    window.mapView.containerPointToLatLng = function (x, y) {
      return { lat: 123, lng: 456 };
    };

    this._exportImageFormModel = new ExportImageFormModel({
      format: '.png',
      x: 10,
      y: 100,
      width: 300,
      height: 200
    });

    this.view = new ExportImageWidget({
      model: this._exportImageFormModel,
      mapViewClass: 'CDB-Map-wrapper',
      dashboardCanvasClass: 'CDB-Dashboard-canvas'
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

  afterEach(function () {
    this.view.remove();
  });
});
