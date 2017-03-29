var Backbone = require('backbone');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');
var ExportImagePane = require('../../../../../javascripts/cartodb3/editor/export-image-pane/export-image-pane');
var ExportImageFormModel = require('../../../../../javascripts/cartodb3/editor/export-image-pane/export-image-form-model');

describe('editor/export-image-pane/export-image-pane', function () {
  beforeEach(function () {
    window.mapView = new Backbone.View();
    window.mapView.containerPointToLatLng = function (x, y) {
      return { lat: 123, lng: 456 };
    };

    var vis = {};
    window.vis = vis;

    vis.map = {};
    vis.map.getZoom = function () { return 10; };
    vis.getStaticImageURL = function () { };

    spyOn(vis, 'getStaticImageURL').and.callThrough();

    this._exportImageFormModel = new ExportImageFormModel({
      format: '.png',
      x: 10,
      y: 100,
      width: 300,
      height: 200
    });

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({
      username: 'pericoo'
    }, {
      configModel: configModel
    });

    this.view = new ExportImagePane({
      model: this._exportImageFormModel,
      modals: [],
      mapViewClass: 'CDB-Map-wrapper',
      dashboardCanvasClass: 'CDB-Dashboard-canvas',
      canvasClassName: 'CDB-Map',
      configModel: configModel,
      userModel: userModel,
      editorModel: new Backbone.Model(),
      privacyCollection: new Backbone.Collection(),
      widgetDefinitionsCollection: new Backbone.Collection(),
      mapcapsCollection: new Backbone.Collection(),
      visDefinitionModel: new Backbone.Model(),
      mapStackLayoutModel: new Backbone.Model(),
      stateDefinitionModel: new Backbone.Model(),
      stackLayoutModel: new Backbone.Model()
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$el.length).toBe(1);
  });

  it('should call the method to generate the image', function () {
    this.view.$('.js-ok').click();
    expect(window.vis.getStaticImageURL).toHaveBeenCalledWith({
      zoom: 10,
      width: 300,
      height: 200,
      lat: 123,
      lng: 456,
      format: 'png'
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});
