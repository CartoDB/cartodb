var FavMapView = require('../../../../javascripts/cartodb/public_dashboard/fav_map_view');
var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');

describe('public_dashboard/fav_map_view', function() {
  beforeEach(function() {
    spyOn(cdb, 'createVis');
    this.createdVisSpy = jasmine.createSpyObj('cartodb.js vis', ['done']);
    cdb.createVis.and.returnValue(this.createdVisSpy);

    this.targetId = 'fav-map-container';
    this.$target = $('<div id="' + this.targetId + '"></div>');
    this.$target.appendTo(document.body);

    this.attrs = {
      el: '#' + this.targetId
    };
    this.createFavMapView = function() {
      this.view = new FavMapView(this.attrs);
      this.view.render();
    };
  });

  describe('given args to create map from a visualization', function() {
    beforeEach(function() {
      this.attrs.createVis = {
        url: '//host.ext/some/path/vis.json',
        opts: {}
      };
    });

    describe('and default opts', function() {
      beforeEach(function() {
        this.createFavMapView();
      });

      it('should create a visualization', function() {
        expect(cdb.createVis).toHaveBeenCalled();
      });

      it('should render vis in given target element identified by an id', function() {
        expect(cdb.createVis.calls.argsFor(0)[0]).toEqual(this.$target[0]);
      });

      it('should create vis with given URL', function() {
        expect(cdb.createVis.calls.argsFor(0)[1]).toEqual('//host.ext/some/path/vis.json');
      });

      it('should create vis with a bunch of options', function() {
        expect(cdb.createVis.calls.argsFor(0)[2]).toEqual(jasmine.any(Object));
      });

      it('should load tiles from CDN by default', function() {
        expect(cdb.createVis.calls.argsFor(0)[2]).toEqual(jasmine.objectContaining({ no_cdn: false }));
      });

      it('should set .is-loading class on target element', function() {
        expect(this.$target.attr('class')).toContain('is-loading');
      });

      describe('and loading finishes', function() {
        beforeEach(function() {
          this.createdVisSpy.done.calls.argsFor(0)[0]();
        });

        it('should remove .is-loading class on target element', function() {
          expect(this.$target.attr('class')).not.toContain('is-loading');
        });
      });
    });

    describe('and option to not load tiles from CDN', function() {
      beforeEach(function() {
        this.attrs.createVis.opts.no_cdn = true;
        this.createFavMapView();
      });

      it('should create vis with not loading tiles from CDN', function() {
        expect(cdb.createVis.calls.argsFor(0)[2]).toEqual(jasmine.objectContaining({ no_cdn: true }));
      });
    });
  });

  describe('given there is no data to create map from an user visualization', function() {
    beforeEach(function() {
      this.attrs.fallbackBaselayer = {
        urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
      };
      this.createFavMapView();
    });

    it('should create a fallback map', function() {
      expect(cdb.createVis).toHaveBeenCalled();
    });

    it('should create the fallback map with a given basemap template URL', function() {
      var args = cdb.createVis.calls.argsFor(0);
      expect(args[0]).toBe(this.view.el);
      expect(args[1].layers[0].urlTemplate).toEqual('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png');
      expect(args[1].map_provider).toEqual('leaflet')
    });
  });

  describe('given there is no data to create map from an user visualization with gmaps', function() {
    beforeEach(function() {
      this.attrs.fallbackBaselayer = { };
      this.createFavMapView();
    });
    it('should create a fallback map', function() {
      expect(cdb.createVis).toHaveBeenCalled();
    });

    it('should create the fallback map with a gmaps basemap', function() {
      var args = cdb.createVis.calls.argsFor(0);
      expect(args[0]).toBe(this.view.el);
      expect(args[1].layers[0].type).toEqual('GMapsBase')
      expect(args[1].map_provider).toEqual('googlemaps')
    });
  });

  afterEach(function() {
    this.$target.remove();
  });
});
