var $ = require('jquery');
var createVis = require('../../../../src/api/create-vis');
var scenarios = require('./scenarios');

describe('create-vis-new:', function () {
  beforeEach(function () {
    this.container = $('<div id="map">').css('height', '200px');
    this.containerId = this.container[0].id;
    $('body').append(this.container);
  });

  afterEach(function () {
    this.container.remove();
  });

  describe('CreateVis', function () {
    it('should set the right map center', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('center')).toEqual(visJson.center);
    });
    it('should initialize the right title', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('title')).toEqual(visJson.title);
    });
    it('should initialize the right description', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('description')).toEqual(visJson.description);
    });
    it('should initialize the right protocol', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('https')).toEqual(false);
    });
    it('should not have interactive features by default', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('interactiveFeatures')).toEqual(false);
    });
    it('should not have interactive features by default', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('interactiveFeatures')).toEqual(false);
    });
    xit('should not have "tiles_loader" by default', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('tiles_loader')).toEqual(false);
    });
    xit('should not have "loaderControl" by default', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('loaderControl')).toEqual(false);
    });
    xit('should have "infowindow" by default', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('infowindow')).toEqual(true);
    });
    xit('should have "tooltip" by default', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('tooltip')).toEqual(true);
    });
    xit('should have "logo" by default', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('logo')).toEqual(true);
    });
    xit('should have "show_empty_infowindow_fields" by default', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('show_empty_infowindow_fields')).toEqual(true);
    });
    xit('should have legends', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('showLegends')).toEqual(true);
    });
    xit('should show layer selector', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('showLayerSelector')).toEqual(true);
    });
    xit('should allow scrollwheel', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('scrollwheel')).toEqual(true);
    });
    xit('should have dashboard_menu', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('dashboard_menu')).toEqual(true);
    });
  });
});
