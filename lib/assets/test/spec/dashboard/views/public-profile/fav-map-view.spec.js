var $ = require('jquery');
var cdb = require('internal-carto.js');
var L = require('leaflet');
var FavMapView = require('dashboard/views/public-profile/fav-map-view');

describe('dashboard/views/public-profile/fav-map-view', function () {
  beforeEach(function () {
    this.createdVisSpy = jasmine.createSpyObj('cartodb.js vis', ['done']);
    spyOn(cdb, 'createVis').and.returnValue(this.createdVisSpy);
    spyOn(L, 'map').and.callThrough();
    spyOn(L, 'tileLayer').and.callThrough();

    this.targetId = 'fav-map-container';
    this.$target = $('<div id="' + this.targetId + '"></div>');
    this.$target.appendTo(document.body);

    this.attrs = {
      el: '#' + this.targetId
    };

    this.createFavMapView = function () {
      this.view = new FavMapView(this.attrs);
      this.view.render();
    };
  });

  describe('given args to create map from a visualization', function () {
    beforeEach(function () {
      this.attrs.createVis = {
        url: '//host.ext/some/path/vis.json',
        opts: {}
      };
    });

    describe('and default opts', function () {
      beforeEach(function () {
        this.createFavMapView();
      });

      it('should create a visualization', function () {
        expect(cdb.createVis).toHaveBeenCalled();
      });

      it('should render vis in given target element identified by an id', function () {
        expect(cdb.createVis.calls.argsFor(0)[0]).toEqual(this.$target[0]);
      });

      it('should create vis with given URL', function () {
        expect(cdb.createVis.calls.argsFor(0)[1]).toEqual('//host.ext/some/path/vis.json');
      });

      it('should create vis with a bunch of options', function () {
        expect(cdb.createVis.calls.argsFor(0)[2]).toEqual(jasmine.any(Object));
      });

      it('should load tiles from CDN by default', function () {
        expect(cdb.createVis.calls.argsFor(0)[2]).toEqual(jasmine.objectContaining({ no_cdn: false }));
      });

      it('should set .is-loading class on target element', function () {
        expect(this.$target.attr('class')).toContain('is-loading');
      });

      describe('and loading finishes', function () {
        beforeEach(function () {
          this.createdVisSpy.done.calls.argsFor(0)[0]();
        });

        it('should remove .is-loading class on target element', function () {
          expect(this.$target.attr('class')).not.toContain('is-loading');
        });
      });
    });

    describe('and option to not load tiles from CDN', function () {
      beforeEach(function () {
        this.attrs.createVis.opts.no_cdn = true;
        this.createFavMapView();
      });

      it('should create vis with not loading tiles from CDN', function () {
        expect(cdb.createVis.calls.argsFor(0)[2]).toEqual(jasmine.objectContaining({ no_cdn: true }));
      });
    });
  });

  describe('given there is no data to create map from an user visualization', function () {
    beforeEach(function () {
      this.attrs = {
        fallbackBaselayer: {
          urlTemplate: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
          attribution: 'Wubba lubba dub dub'
        }
      };
      this.createFavMapView();
    });

    it('should create a fallback map with a tile layer', function () {
      expect(L.map).toHaveBeenCalled();
      expect(L.tileLayer).toHaveBeenCalled();
    });

    it('should create the fallback map with provided base layer', function () {
      var args = L.map.calls.argsFor(0);
      var argEl = args[0];
      var argOpts = args[1];

      expect(argEl).toBe(this.view.el);
      expect(argOpts.scrollWheelZoom).toBe(false);
      expect(argOpts.zoomControl).toBe(false);

      var tileLayerArgs = L.tileLayer.calls.argsFor(0);
      expect(tileLayerArgs[0]).toBe('https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager_nolabels/{z}/{x}/{y}.png');
      expect(tileLayerArgs[1].attribution).toBe('Wubba lubba dub dub');
    });
  });

  it('should have no leaks', function () {
    this.attrs.createVis = {
      url: '//host.ext/some/path/vis.json',
      opts: {}
    };

    this.createFavMapView();
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.$target.remove();
  });
});
