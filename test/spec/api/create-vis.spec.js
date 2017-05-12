var _ = require('underscore');
var $ = require('jquery');
var Loader = require('../../../src/core/loader');
var createVis = require('../../../src/api/create-vis');
var VizJSON = require('../../../src/api/vizjson');
var fakeVizJSON = require('./fake-vizjson');

describe('src/api/create-vis', function () {
  beforeEach(function () {
    this.container = $('<div id="map">').css('height', '200px');
    this.containerId = this.container[0].id;
    $('body').append(this.container);

    this.$ajax = $.ajax;
    spyOn($, 'ajax').and.callFake(function (options) {
      if (options.url.indexOf(options.url.indexOf('http://cdb.localhost.lan:8181/api/v1/map/named/tpl_6a31d394_7c8e_11e5_8e42_080027880ca6/jsonp?') === 0)) {
        options.success && options.success({
          layergroupid: '1234567890'
        });
      }

      this.$ajax(options);
    }.bind(this));
  });

  afterEach(function () {
    $.ajax = this.$ajax;
    this.container.remove();
  });

  it('should throw errors', function () {
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

  it('should load the vizjson file from a URL', function () {
    spyOn(Loader, 'get');
    var vis = createVis(this.containerId, 'http://example.com/vizjson', {
      skipMapInstantiation: true
    });
    spyOn(vis, 'load').and.callThrough();

    // Simulate a successful response from Loader.get
    var loaderCallback = Loader.get.calls.mostRecent().args[1];
    loaderCallback(fakeVizJSON);

    expect(vis.load).toHaveBeenCalledWith(jasmine.any(VizJSON));
  });

  it('should use the given vizjson object', function () {
    spyOn(Loader, 'get');
    createVis(this.containerId, fakeVizJSON, {
      skipMapInstantiation: true
    });

    expect(Loader.get).not.toHaveBeenCalled();
  });

  it('should initialize the visModel correctly', function () {
    var vizJSON = _.extend(fakeVizJSON, {
      title: 'TITLE',
      description: 'DESCRIPTION',
      https: true
    });
    var visModel = createVis(this.containerId, vizJSON, {
      apiKey: 'API_KEY',
      authToken: 'AUTH_TOKEN',
      show_empty_infowindow_fields: true,
      skipMapInstantiation: true
    });

    expect(visModel.get('title')).toEqual('TITLE');
    expect(visModel.get('description')).toEqual('DESCRIPTION');
    expect(visModel.get('authToken')).toEqual('AUTH_TOKEN');
    expect(visModel.get('showEmptyInfowindowFields')).toEqual(true);
    expect(visModel.get('https')).toEqual(true);
  });

  it('should set the given center if values are correct', function () {
    var opts = {
      center_lat: 43.3,
      center_lon: '89'
    };

    var vis = createVis(this.containerId, fakeVizJSON, opts);

    expect(vis.map.get('center')).toEqual([43.3, 89.0]);
  });

  it('should not set the center if values are not correct', function () {
    var opts = {
      center_lat: 43.3,
      center_lon: 'ham'
    };

    var vis = createVis(this.containerId, fakeVizJSON, opts);

    expect(vis.map.get('center')).toEqual([ 41.40578459184651, 2.2230148315429688 ]);
  });

  it('should parse bounds values if they are correct', function () {
    var opts = {
      sw_lat: 43.3,
      sw_lon: 12,
      ne_lat: 12,
      ne_lon: '0'
    };

    var vis = createVis(this.containerId, fakeVizJSON, opts);

    expect(vis.map.get('view_bounds_sw')).toEqual([43.3, 12]);
    expect(vis.map.get('view_bounds_ne')).toEqual([12, 0]);
  });

  it('should not parse bounds values if they are not correct', function () {
    var opts = {
      sw_lat: 43.3,
      sw_lon: 12,
      ne_lat: 'jamon',
      ne_lon: '0'
    };

    var vis = createVis(this.containerId, fakeVizJSON, opts);

    expect(vis.map.get('view_bounds_sw')).toEqual([
      41.340989240001214,
      2.0194244384765625
    ]);
    expect(vis.map.get('view_bounds_ne')).toEqual([
      41.47051539294297,
      2.426605224609375
    ]);
  });

  it('should not add header', function (done) {
    fakeVizJSON.title = 'title';

    var opts = {
      title: true
    };

    var vis = createVis(this.containerId, fakeVizJSON, opts);

    vis.once('load', function () {
      expect(this.container.find('.cartodb-header').length).toEqual(0);
      done();
    }.bind(this));
  });

  it('should add zoom', function (done) {
    fakeVizJSON.overlays = [{ type: 'zoom', order: 7, options: { x: 20, y: 20 }, template: 'test' }];

    var vis = createVis(this.containerId, fakeVizJSON, {});

    vis.once('load', function () {
      expect(this.container.find('.CDB-Zoom').length).toEqual(1);
      done();
    }.bind(this));
  });

  it("should enable zoom if it's specified by zoomControl option", function (done) {
    fakeVizJSON.overlays = [{ type: 'zoom', order: 7, options: { x: 20, y: 20 }, template: 'test' }];
    var opts = {
      zoomControl: true
    };

    var vis = createVis(this.containerId, fakeVizJSON, opts);

    vis.once('load', function () {
      expect(this.container.find('.CDB-Zoom').length).toEqual(1);
      done();
    }.bind(this));
  });

  it("should disable zoom if it's specified by zoomControl option", function (done) {
    fakeVizJSON.overlays = [{ type: 'zoom', order: 7, options: { x: 20, y: 20 }, template: 'test' }];
    var opts = {
      zoomControl: false
    };

    var vis = createVis(this.containerId, fakeVizJSON, opts);

    vis.once('load', function () {
      expect(this.container.find('.CDB-Zoom').length).toEqual(0);
      done();
    }.bind(this));
  });

  it('should add search', function (done) {
    fakeVizJSON.overlays = [{ type: 'search' }];

    var vis = createVis(this.containerId, fakeVizJSON, {});

    vis.once('load', function () {
      expect(this.container.find('.CDB-Search').length).toEqual(1);
      done();
    }.bind(this));
  });

  it("should enable search if it's specified by searchControl", function (done) {
    fakeVizJSON.overlays = [{ type: 'search' }];

    var opts = {
      searchControl: true
    };

    var vis = createVis(this.containerId, fakeVizJSON, opts);

    vis.once('load', function () {
      expect(this.container.find('.CDB-Search').length).toEqual(1);
      done();
    }.bind(this));
  });

  it("should disable search if it's specified by searchControl", function (done) {
    fakeVizJSON.overlays = [{ type: 'search' }];

    var opts = {
      searchControl: false
    };

    var vis = createVis(this.containerId, fakeVizJSON, opts);

    vis.once('load', function () {
      expect(this.container.find('.CDB-Search').length).toEqual(0);
      done();
    }.bind(this));
  });

  it("should disable logo if it's specified by logo", function (done) {
    fakeVizJSON.overlays = [{ type: 'logo' }];

    var opts = {
      logo: false
    };

    var vis = createVis(this.containerId, fakeVizJSON, opts);

    vis.once('load', function () {
      expect(this.container.find('.CDB-Logo').length).toEqual(0);
      done();
    }.bind(this));
  });

  var mapInstantiationRequestDone = function () {
    return _.any($.ajax.calls.allArgs(), function (args) {
      var expectedURLRegexp = /(http|https):\/\/cdb.localhost.lan:8181\/api\/v1\/map\/named\/tpl_6a31d394_7c8e_11e5_8e42_080027880ca6\/jsonp\?/;
      return args[0].url.match(expectedURLRegexp);
    });
  };

  describe('map instantiation', function () {
    it('should instantiate map using a GET request', function (done) {
      this.vis = createVis(this.containerId, fakeVizJSON, {});

      setTimeout(function () {
        expect(mapInstantiationRequestDone()).toEqual(true);
        done();
      }, 25);
    });

    it('should NOT instantiate map if skipMapInstantiation options is set to true', function (done) {
      this.vis = createVis(this.containerId, fakeVizJSON, {
        skipMapInstantiation: true
      });

      setTimeout(function () {
        expect(mapInstantiationRequestDone()).toEqual(false);
        done();
      }, 25);
    });
  });
});
