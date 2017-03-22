var $ = require('jquery');
var Backbone = require('backbone');
var VisModel = require('../../../src/vis/vis');
var Layers = require('../../../src/geo/map/layers');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var CartoDBLayerGroup = require('../../../src/geo/cartodb-layer-group');

describe('geo/cartodb-layer-group', function () {
  beforeEach(function () {
    this.layersCollection = new Layers();
    this.vis = new VisModel();
    spyOn(this.vis, 'reload');

    this.cartoDBLayerGroup = new CartoDBLayerGroup({}, {
      layersCollection: this.layersCollection
    });
  });

  describe('.fetchAttributes', function () {
    beforeEach(function () {
      this.cartoDBLayerGroup.set('urls', {
        attributes: [
          'http://carto.com/1/attributes',
          'http://carto.com/2/attributes'
        ]
      });

      spyOn($, 'ajax').and.callFake(function (options) {
        options.success('attributes!');
      });
    });

    it('should trigger a request to the right URL', function () {
      var callback = jasmine.createSpy('callback');

      this.cartoDBLayerGroup.fetchAttributes(0, 1000, callback);

      expect(callback).toHaveBeenCalledWith('attributes!');
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://carto.com/1/attributes/1000');
    });

    it('should invoke the callback with null when the ajax request fails', function () {
      var callback = jasmine.createSpy('callback');

      $.ajax.and.callFake(function (options) {
        options.error('error!');
      });

      this.cartoDBLayerGroup.fetchAttributes(0, 1000, callback);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it('should append the api_key to urls', function () {
      this.cartoDBLayerGroup.set('apiKey', 'THE_API_KEY');

      var callback = jasmine.createSpy('callback');

      this.cartoDBLayerGroup.fetchAttributes(1, 1000, callback);

      expect(callback).toHaveBeenCalledWith('attributes!');
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://carto.com/2/attributes/1000?api_key=THE_API_KEY');
    });

    it('should append the auth_token to urls', function () {
      this.cartoDBLayerGroup.set('authToken', 'AUTH_TOKEN');

      var callback = jasmine.createSpy('callback');

      this.cartoDBLayerGroup.fetchAttributes(1, 1000, callback);

      expect(callback).toHaveBeenCalledWith('attributes!');
      expect($.ajax.calls.mostRecent().args[0].url).toEqual('http://carto.com/2/attributes/1000?auth_token=AUTH_TOKEN');
    });
  });

  describe('.getTileURLTemplate', function () {
    beforeEach(function () {
      this.cartoDBLayerGroup = new CartoDBLayerGroup({
        indexOfLayersInWindshaft: [1, 2]
      }, {
        layersCollection: this.layersCollection
      });

      var otherLayer = new Backbone.Model();
      this.cartoDBLayer1 = new CartoDBLayer({}, { vis: this.vis });
      this.cartoDBLayer2 = new CartoDBLayer({}, { vis: this.vis });
      this.layersCollection.reset([
        otherLayer,
        this.cartoDBLayer1,
        this.cartoDBLayer2
      ]);
    });

    it('should return an empty array there are NO urls yet', function () {
      expect(this.cartoDBLayerGroup.getTileURLTemplate()).toEqual('');
    });

    it('should return an empty array if there are NO tile URL templates', function () {
      this.cartoDBLayerGroup.set('urls', {
        tiles: ''
      });
      expect(this.cartoDBLayerGroup.getTileURLTemplate()).toEqual('');
    });

    describe('png', function () {
      beforeEach(function () {
        this.cartoDBLayerGroup.set('urls', {
          tiles: 'http://carto.com/{layerIndexes}/{z}/{x}/{y}.{format}'
        });
      });

      it('should return an array with the tile URL templates', function () {
        expect(this.cartoDBLayerGroup.getTileURLTemplate()).toEqual('http://carto.com/1,2/{z}/{x}/{y}.png');
      });

      it('should not include index of layers that are hidden', function () {
        this.cartoDBLayer1.set('visible', false);

        expect(this.cartoDBLayerGroup.getTileURLTemplate()).toEqual('http://carto.com/2/{z}/{x}/{y}.png');
      });

      it('should return an empty array if all layers are hidden', function () {
        this.cartoDBLayer1.set('visible', false);
        this.cartoDBLayer2.set('visible', false);

        expect(this.cartoDBLayerGroup.getTileURLTemplate()).toEqual('');
      });

      it('should append the api_key to urls', function () {
        this.cartoDBLayerGroup.set({
          apiKey: 'THE_API_KEY'
        });

        expect(this.cartoDBLayerGroup.getTileURLTemplate()).toEqual('http://carto.com/1,2/{z}/{x}/{y}.png?api_key=THE_API_KEY');
      });

      it('should append the auth_token to urls', function () {
        this.cartoDBLayerGroup.set({
          authToken: 'AUTH_TOKEN'
        });

        expect(this.cartoDBLayerGroup.getTileURLTemplate()).toEqual('http://carto.com/1,2/{z}/{x}/{y}.png?auth_token=AUTH_TOKEN');
      });
    });

    describe('mvt', function () {
      beforeEach(function () {
        this.cartoDBLayerGroup.set('urls', {
          tiles: 'http://carto.com/{layerIndexes}/{z}/{x}/{y}.{format}'
        });
      });

      it('should return a single tile URL template', function () {
        expect(this.cartoDBLayerGroup.getTileURLTemplate('mvt')).toEqual('http://carto.com/mapnik/{z}/{x}/{y}.mvt');
      });

      it('should return a single tile URL template if all layers are hidden', function () {
        this.cartoDBLayer1.set('visible', false);
        this.cartoDBLayer2.set('visible', false);

        expect(this.cartoDBLayerGroup.getTileURLTemplate('mvt')).toEqual('http://carto.com/mapnik/{z}/{x}/{y}.mvt');
      });

      it('should append the api_key to urls', function () {
        this.cartoDBLayerGroup.set({
          apiKey: 'THE_API_KEY'
        });

        expect(this.cartoDBLayerGroup.getTileURLTemplate('mvt')).toEqual('http://carto.com/mapnik/{z}/{x}/{y}.mvt?api_key=THE_API_KEY');
      });

      it('should append the auth_token to urls', function () {
        this.cartoDBLayerGroup.set({
          authToken: 'AUTH_TOKEN'
        });

        expect(this.cartoDBLayerGroup.getTileURLTemplate('mvt')).toEqual('http://carto.com/mapnik/{z}/{x}/{y}.mvt?auth_token=AUTH_TOKEN');
      });
    });
  });

  describe('.hasTileURLTemplates', function () {
    beforeEach(function () {
      this.cartoDBLayer1 = new CartoDBLayer({}, { vis: this.vis });
      this.cartoDBLayer2 = new CartoDBLayer({}, { vis: this.vis });
      this.layersCollection.reset([
        this.cartoDBLayer1,
        this.cartoDBLayer2
      ]);

      this.cartoDBLayerGroup = new CartoDBLayerGroup({
        indexOfLayersInWindshaft: [1, 2]
      }, {
        layersCollection: this.layersCollection
      });
    });

    it('should return false if there are NO urls yet', function () {
      expect(this.cartoDBLayerGroup.hasTileURLTemplates()).toBe(false);
    });

    it('should return false if there are NO tile URL templates', function () {
      this.cartoDBLayerGroup.set('urls', {
        tiles: ''
      });
      expect(this.cartoDBLayerGroup.hasTileURLTemplates()).toBe(false);
    });

    it('should return true if there are tile URL templates', function () {
      this.cartoDBLayerGroup.set('urls', {
        tiles: 'url1'
      });

      expect(this.cartoDBLayerGroup.hasTileURLTemplates()).toBe(true);
    });
  });

  describe('.getGridURLTemplates', function () {
    beforeEach(function () {
      this.cartoDBLayerGroup = new CartoDBLayerGroup({}, {
        layersCollection: this.layersCollection
      });
    });

    it('should return an empty array there are NO urls yet', function () {
      expect(this.cartoDBLayerGroup.getGridURLTemplates(0)).toEqual([]);
      expect(this.cartoDBLayerGroup.getGridURLTemplates(1)).toEqual([]);
    });

    it('should return an array with the grid URL templates', function () {
      this.cartoDBLayerGroup.set('urls', {
        grids: [
          [ 'url1' ],
          [ 'url2' ]
        ]
      });

      expect(this.cartoDBLayerGroup.getGridURLTemplates(0)).toEqual([ 'url1' ]);
      expect(this.cartoDBLayerGroup.getGridURLTemplates(1)).toEqual([ 'url2' ]);
    });

    it('should append the api_key to urls', function () {
      this.cartoDBLayerGroup.set({
        apiKey: 'THE_API_KEY',
        urls: {
          grids: [
            [ 'url1' ],
            [ 'url2' ]
          ]
        }
      });

      expect(this.cartoDBLayerGroup.getGridURLTemplates(0)).toEqual([ 'url1?api_key=THE_API_KEY' ]);
      expect(this.cartoDBLayerGroup.getGridURLTemplates(1)).toEqual([ 'url2?api_key=THE_API_KEY' ]);
    });

    it('should append the auth_token to urls', function () {
      this.cartoDBLayerGroup.set({
        authToken: 'AUTH_TOKEN',
        urls: {
          grids: [
            [ 'url1' ],
            [ 'url2' ]
          ]
        }
      });

      expect(this.cartoDBLayerGroup.getGridURLTemplates(0)).toEqual([ 'url1?auth_token=AUTH_TOKEN' ]);
      expect(this.cartoDBLayerGroup.getGridURLTemplates(1)).toEqual([ 'url2?auth_token=AUTH_TOKEN' ]);
    });
  });

  describe('.getAttributesBaseURL', function () {

  });
});
