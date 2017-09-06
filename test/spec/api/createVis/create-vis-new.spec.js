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

  describe('Default Options', function () {
    it('should get the map center from the visJson', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('center')).toEqual(visJson.center);
    });
    it('should get the title from the visJson', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('title')).toEqual(visJson.title);
    });
    it('should get the description from the visJson', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('description')).toEqual(visJson.description);
    });
    it('should initialize the right protocol (https:false)', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('https')).toEqual(false);
    });
    it('should not have interactive features by default', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('interactiveFeatures')).toEqual(false);
    });
    it('should display the "loader" overlay by default [loaderControl, tiles_loader]', function () {
      // loaderControl and tiles_loader appear to do the same.
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.overlaysCollection.findWhere({ type: 'loader' })).toBeDefined();
    });
    it('should display the "logo" by default', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.overlaysCollection.findWhere({ type: 'logo' })).toBeDefined();
    });
    it('should not display empty infowindow fields by default', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('showEmptyInfowindowFields')).toEqual(false);
    });
    it('should have legends', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.settings.get('showLegends')).toEqual(true);
    });
    it('should show layer selector', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.settings.get('showLayerSelector')).toEqual(true);
      expect(visModel.settings.get('layerSelectorEnabled')).toEqual(true);
    });
    it('should allow scrollwheel by default', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('scrollwheel')).toEqual(true);
    });
    it('should have "infowindow" enabled by default', function () {
      pending('It seems that this option is no longer being used');
    });
    it('should have "tooltip" by default', function () {
      pending('It seems that this option  is no longer being used');
    });
  });

  describe('VisModel.map', function () {
    it('should have the right title', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('title')).toEqual(visJson.title);
    });
    it('should have the right description', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('description')).toEqual(visJson.description);
    });
    it('should have the right bounds', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('view_bounds_sw')).toEqual(visJson.bounds[0]);
      expect(visModel.map.get('view_bounds_ne')).toEqual(visJson.bounds[1]);
    });
    it('should have the right zoom', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('zoom')).toEqual(visJson.zoom);
    });
    it('should have the right scrollwheel', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('scrollwheel')).toEqual(visJson.options.scrollwheel);
    });
    it('should have the right drag', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('drag')).toEqual(true);
    });
    it('should have the right provider', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('provider')).toEqual('leaflet');
    });
    it('should have the right feature interactivity', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('isFeatureInteractivityEnabled')).toEqual(false);
    });
    it('should have the right render mode', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('renderMode')).toEqual(visJson.vector ? 'vector' : 'raster');
    });
  });

  describe('VisModel._windshaftMap', function () {
    /**
      client: windshaftClient,
      modelUpdater: modelUpdater,
      windshaftSettings: windshaftSettings,
      dataviewsCollection: this._dataviewsCollection,
      layersCollection: this._layersCollection,
      analysisCollection: this._analysisCollection
     */
    it('should not have the api key', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel._windshaftMap.get('apiKey')).toEqual(undefined);
    });
    it('should not have auth token', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel._windshaftMap.get('authToken')).toEqual(undefined);
    });
    it('should have the right statTag', function () {
      var visJson = scenarios.load(0);
      var visModel = createVis(this.containerId, visJson);
      expect(visModel._windshaftMap.get('statTag')).toEqual(visJson.datasource.stat_tag);
    });
  });

  xdescribe('VisModel.overlays', function () {
    it('should set the right map center', function () {

    });
  });

  xdescribe('VisModel.dataviews', function () {
    it('should set the right map center', function () {
    });
  });

  xdescribe('VisModel.analysis', function () {
    it('should set the right map center', function () {
    });
  });
});
