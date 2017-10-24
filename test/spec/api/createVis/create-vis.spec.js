var $ = require('jquery');
var createVis = require('../../../../src/api/create-vis');
var scenarios = require('./scenarios');
var Loader = require('../../../../src/core/loader');

describe('create-vis:', function () {
  beforeEach(function () {
    this.container = $('<div id="map">').css('height', '200px');
    this.containerId = this.container[0].id;
    $('body').append(this.container);
  });

  afterEach(function () {
    this.container.remove();
  });

  it('should throw errors when required parameters are missing', function () {
    expect(function () {
      createVis();
    }).toThrowError('a valid DOM element or selector must be provided');

    expect(function () {
      createVis('something');
    }).toThrowError('a valid DOM element or selector must be provided');

    expect(function () {
      createVis(this.containerId);
    }.bind(this)).toThrowError('a vizjson URL or object must be provided');

    expect(function () {
      createVis(this.container[0], 'vizjson');
    }.bind(this)).not.toThrowError();

    expect(function () {
      createVis(this.containerId, 'vizjson');
    }.bind(this)).not.toThrowError();
  });

  it('should use the given vis.json (instead downloading) when the visjson parameter is provided', function () {
    spyOn(Loader, 'get');
    var visJson = scenarios.load('basic');
    createVis(this.containerId, visJson);
    expect(Loader.get).not.toHaveBeenCalled();
  });

  it('should download the vizjson file from a URL when the visjson parameter is provided and is a string', function () {
    spyOn(Loader, 'get');
    createVis(this.containerId, 'www.example.com/fake_vis.json');
    expect(Loader.get).toHaveBeenCalledWith('www.example.com/fake_vis.json', jasmine.any(Function));
  });

  describe('Default (no Options)', function () {
    it('should get the map center from the visJson', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('center')).toEqual(visJson.center);
    });

    it('should get the title from the visJson', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('title')).toEqual(visJson.title);
    });

    it('should get the description from the visJson', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('description')).toEqual(visJson.description);
    });

    it('should initialize the right protocol (https:false)', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('https')).toEqual(false);
    });

    it('should not have interactive features by default', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('interactiveFeatures')).toEqual(false);
    });

    it('should display the "loader" overlay by default [loaderControl, tiles_loader]', function () {
      // loaderControl and tiles_loader appear to do the same.
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.overlaysCollection.findWhere({ type: 'loader' })).toBeDefined();
    });

    it('should display the "logo" by default', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.overlaysCollection.findWhere({ type: 'logo' })).toBeDefined();
    });

    it('should not display empty infowindow fields by default', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.get('showEmptyInfowindowFields')).toEqual(false);
    });

    it('should have legends', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.settings.get('showLegends')).toEqual(true);
    });

    it('should show layer selector', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.settings.get('showLayerSelector')).toEqual(true);
      expect(visModel.settings.get('layerSelectorEnabled')).toEqual(true);
    });

    it('should allow scrollwheel by default', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('scrollwheel')).toEqual(true);
    });
  });

  describe('Options', function () {
    describe('skipMapInstantiation', function () {
      it('should instantiate map when skipMapInstantiation option is falsy', function (done) {
        var visJson = scenarios.load('basic');
        var visModel = createVis(this.containerId, visJson);
        setTimeout(function () {
          expect(visModel._instantiateMapWasCalled).toEqual(true);
          done();
        }, 25);
      });

      it('should NOT instantiate map when skipMapInstantiation option is truthy', function (done) {
        var visJson = scenarios.load('basic');
        var visModel = createVis(this.containerId, visJson, { skipMapInstantiation: true });
        setTimeout(function () {
          expect(visModel._instantiateMapWasCalled).toEqual(false);
          done();
        }, 25);
      });
    });
  });

  describe('VisModel.map', function () {
    it('should have the right title', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('title')).toEqual(visJson.title);
    });

    it('should have the right description', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('description')).toEqual(visJson.description);
    });

    it('should have the right bounds', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('view_bounds_sw')).toEqual(visJson.bounds[0]);
      expect(visModel.map.get('view_bounds_ne')).toEqual(visJson.bounds[1]);
    });

    it('should have the right zoom', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('zoom')).toEqual(visJson.zoom);
    });

    it('should have the right scrollwheel', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('scrollwheel')).toEqual(visJson.options.scrollwheel);
    });

    it('should have the right drag', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('drag')).toEqual(true);
    });

    it('should have the right provider', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('provider')).toEqual('leaflet');
    });

    it('should have the right feature interactivity', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('isFeatureInteractivityEnabled')).toEqual(false);
    });

    it('should have the right render mode', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.map.get('renderMode')).toEqual(visJson.vector ? 'vector' : 'raster');
    });
  });

  describe('VisModel.overlays', function () {
    it('should have a share overlay', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      // TODO: Review if this overlay is still supported!
      expect(visModel.overlaysCollection.findWhere({ type: 'share' })).toBeDefined();
    });

    it('should have a search overlay', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.overlaysCollection.findWhere({ type: 'search' })).toBeDefined();
    });

    it('should have a zoom overlay', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.overlaysCollection.findWhere({ type: 'zoom' })).toBeDefined();
    });

    it('should have a loader overlay', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.overlaysCollection.findWhere({ type: 'loader' })).toBeDefined();
    });

    it('should have a logo overlay', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.overlaysCollection.findWhere({ type: 'logo' })).toBeDefined();
    });

    it('should have a attribution overlay', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel.overlaysCollection.findWhere({ type: 'attribution' })).toBeDefined();
    });
  });

  describe('VisModel._dataviewsCollection', function () {
    it('should not have dataviews', function () {
      var visJson = scenarios.load('basic');
      var visModel = createVis(this.containerId, visJson);
      expect(visModel._dataviewsCollection.length).toEqual(0);
    });
  });
});
