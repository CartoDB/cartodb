var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var MapboxToTileLayerFactory = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/mapbox/mapbox_to_tile_layer_factory');

describe('MapboxToTileLayerFactory', function() {
  beforeEach(function() {
    this.baseLayers = new cdb.admin.UserLayers();
    this.factory = new MapboxToTileLayerFactory({
      url: 'https://a.tiles.mapbox.com/v4/username.123abc45d/',
      accessToken: 'x.y123zwv456'
    });
  });

  describe('._fixHTTPS', function() {
    it('should fix mapbox https url', function() {
      var url = MapboxToTileLayerFactory.prototype._fixHTTPS('http://a.tiles.mapbox.com/v4/examples.map-4l7djmvo.json', {
        protocol: 'https:'
      });
      expect(url).toEqual('https://dnv9my2eseobd.cloudfront.net/v4/examples.map-4l7djmvo.json');

      url = MapboxToTileLayerFactory.prototype._fixHTTPS('http://a.tiles.mapbox.com/v4/examples.map-4l7djmvo.json', {
        protocol: 'http:'
      });
      expect(url).toEqual('http://a.tiles.mapbox.com/v4/examples.map-4l7djmvo.json')
    });
  });

  // Tests extracted from basemap_chooser_dialog
  describe('.createTileLayer', function() {
    beforeEach(function() {
      this.successSpy = jasmine.createSpy('success');
      this.errorSpy = jasmine.createSpy('error');
      this.callbacks = {
        success: this.successSpy,
        error: this.errorSpy
      };

      // for sure jasmine has a function for this
      spyOn($, 'ajax');
    });

    describe('when provided an edit URL', function() {
      beforeEach(function() {
        this.username = 'cartodb';
        this.mapID = 'map-eeoepub0';
        this.mapboxID = this.username + '.' + this.mapID;
        this.accessToken = 'ACCESS_TOKEN';

        this.factory.set({
          url: 'https://tiles.mapbox.com/' + this.username + '/edit/' + this.mapID + '#3/0.09/0.00',
          accessToken: this.accessToken
        });
        this.factory.createTileLayer(this.callbacks);
      });

      describe('when valid URL and access token', function() {
        beforeEach(function() {
          $.ajax.calls.argsFor(0)[0].success({
            attribution: 'attribution str',
            minzoom: 2,
            maxzoom: 4
          });
        });

        it('should call the success callback', function() {
          expect(this.successSpy).toHaveBeenCalled();
        });

        it('should have an expected urlTemplate value on the returned layer', function() {
          expect(this.successSpy).toHaveBeenCalledWith(jasmine.any(Object));
          var url = 'https://a.tiles.mapbox.com/v4/' + this.mapboxID + '/{z}/{x}/{y}.png?access_token=' + this.accessToken;
          expect(this.successSpy.calls.argsFor(0)[0].get('urlTemplate')).toEqual(url);
        });

        it('should also set expected metadata', function() {
          var tileLayer = this.successSpy.calls.argsFor(0)[0];
          expect(tileLayer.get('attribution')).toEqual('attribution str');
          expect(tileLayer.get('minZoom')).toEqual(2);
          expect(tileLayer.get('maxZoom')).toEqual(4);
        });
      });

      describe('when fails to validate URL or access token', function() {
        beforeEach(function() {
          $.ajax.calls.argsFor(0)[0].error();
        });

        it('should call error callback with error message', function() {
          expect(this.errorSpy).toHaveBeenCalled();
          expect(this.errorSpy).toHaveBeenCalledWith(jasmine.any(String));
        });
      });
    });

    describe('when provided an embed URL', function() {
      beforeEach(function() {
        this.mapboxID = 'cartodb.map-eeoepub0';
        this.accessToken = 'ACCESS_TOKEN';

        this.factory.set({
          url: 'http://a.tiles.mapbox.com/v4/' + this.mapboxID + '/page.html',
          accessToken: this.accessToken
        });
        this.factory.createTileLayer(this.callbacks);
      });

      describe('when valid URL and access token', function() {
        beforeEach(function() {
          $.ajax.calls.argsFor(0)[0].success({
            attribution: 'attribution str',
            minzoom: 2,
            maxzoom: 4
          });
        });

        it('should call the success callback', function() {
          expect(this.successSpy).toHaveBeenCalled();
        });

        it('should have an expected urlTemplate value on the returned layer', function() {
          expect(this.successSpy).toHaveBeenCalledWith(jasmine.any(Object));
          var url = 'https://a.tiles.mapbox.com/v4/' + this.mapboxID + '/{z}/{x}/{y}.png?access_token=' + this.accessToken;
          expect(this.successSpy.calls.argsFor(0)[0].get('urlTemplate')).toEqual(url);
        });

        it('should also set expected metadata', function() {
          var tileLayer = this.successSpy.calls.argsFor(0)[0];
          expect(tileLayer.get('attribution')).toEqual('attribution str');
          expect(tileLayer.get('minZoom')).toEqual(2);
          expect(tileLayer.get('maxZoom')).toEqual(4);
        });
      });

      describe('when fails to validate URL or access token', function() {
        beforeEach(function() {
          $.ajax.calls.argsFor(0)[0].error();
        });

        it('should call error callback with error message', function() {
          expect(this.errorSpy).toHaveBeenCalled();
          expect(this.errorSpy).toHaveBeenCalledWith(jasmine.any(String));
        });
      });
    });

    describe('when provided a XYZ URL', function() {
      beforeEach(function() {
        this.mapboxID = 'cartodb.map-eeoepub0';
        this.accessToken = 'ACCESS_TOKEN';

        var self = this;
        this.img = {};
        spyOn(window, 'Image').and.callFake( function() {
          return self.img;
        });

        this.factory.set({
          url: 'https://a.tiles.mapbox.com/v4/' + this.mapboxID + '/{z}/{y}/{x}.png',
          accessToken: this.accessToken
        });
        this.factory.createTileLayer(this.callbacks);
      });

      describe('when valid URL, access token and tiles', function() {
        beforeEach(function() {
          this.img.onload();
        });

        it('should call the success callback', function() {
          expect(this.successSpy).toHaveBeenCalled();
        });

        it('should have an expected urlTemplate value on the returned layer', function() {
          expect(this.successSpy).toHaveBeenCalledWith(jasmine.any(Object));
          var url = 'https://a.tiles.mapbox.com/v4/' + this.mapboxID + '/{z}/{y}/{x}.png';
          expect(this.successSpy.calls.argsFor(0)[0].get('urlTemplate')).toEqual(url);
        });

        it('should also set expected metadata', function() {
          var tileLayer = this.successSpy.calls.argsFor(0)[0];
          expect(tileLayer.get('attribution')).toBeNull();
          expect(tileLayer.get('minZoom')).toEqual(0);
          expect(tileLayer.get('maxZoom')).toEqual(21);
        });
      });

      describe('when fails to validate URL or access token', function() {
        beforeEach(function() {
          this.img.onerror();
        });

        it('should call error callback with error message', function() {
          expect(this.errorSpy).toHaveBeenCalled();
          expect(this.errorSpy).toHaveBeenCalledWith(jasmine.any(String));
        });
      });
    });
  });
});
