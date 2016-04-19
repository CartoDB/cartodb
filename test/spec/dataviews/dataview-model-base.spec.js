var _ = require('underscore');
var Backbone = require('backbone');
var DataviewModelBase = require('../../../src/dataviews/dataview-model-base');

describe('dataviews/dataview-model-base', function () {
  beforeEach(function () {
    this.map = new Backbone.Model();
    this.map.getViewBounds = function () {};
    this.map.reload = function () {};
    spyOn(this.map, 'getViewBounds').and.returnValue([[1, 2], [3, 4]]);

    this.model = new DataviewModelBase(null, {
      map: this.map,
      layer: jasmine.createSpyObj('layer', ['get', 'getDataProvider'])
    });
    this.model.toJSON = jasmine.createSpy('toJSON').and.returnValue({});

    // Disable debounce
    spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });
  });

  describe('url', function () {
    it('should include the bbox param', function () {
      this.map.getViewBounds.and.returnValue([['south', 'west'], ['north', 'east']]);

      this.model.set('url', 'http://example.com');
      expect(this.model.url()).toEqual('http://example.com?bbox=west,south,east,north');
    });

    it('should allow subclasses to define specific URL params', function () {
      this.map.getViewBounds.and.returnValue([['south', 'west'], ['north', 'east']]);

      this.model.set('url', 'http://example.com');

      spyOn(this.model, '_getDataviewSpecificURLParams').and.returnValue([ 'a=b', 'c=d' ]);

      expect(this.model.url()).toEqual('http://example.com?bbox=west,south,east,north&a=b&c=d');
    });

    it('should append an api_key param', function () {
      this.map.getViewBounds.and.returnValue([['south', 'west'], ['north', 'east']]);

      this.model.set({
        url: 'http://example.com',
        apiKey: 'THE_API_KEY'
      });

      spyOn(this.model, '_getDataviewSpecificURLParams').and.returnValue([ 'a=b', 'c=d' ]);

      expect(this.model.url()).toEqual('http://example.com?bbox=west,south,east,north&a=b&c=d&api_key=THE_API_KEY');
    });
  });

  describe('when url changes', function () {
    beforeEach(function () {
      spyOn(this.model, 'fetch');
      spyOn(this.model, 'listenTo');
      spyOn(this.model, 'on');
      this.model.set('url', 'new-url');
    });

    it('should fetch', function () {
      expect(this.model.fetch).toHaveBeenCalled();
    });

    describe('when fetch succeeds', function () {
      beforeEach(function () {
        this.model.fetch.calls.argsFor(0)[0].success();
      });

      it('should change bounds', function () {
        expect(this.model.listenTo.calls.argsFor(0)[0]).toEqual(this.model._map);
        expect(this.model.listenTo.calls.argsFor(0)[1]).toEqual('change:center change:zoom');
        expect(this.model.on.calls.argsFor(0)[0]).toEqual('change:url');
        expect(this.model.on.calls.argsFor(1)[0]).toEqual('change:enabled');
      });
    });
  });

  describe('after first load', function () {
    beforeEach(function () {
      this.model.fetch = function (opts) {
        opts.success();
      };
      this.model.set('url', 'newurl');
    });

    it('should not fetch new data when url changes and sync_on_data_change is disabled', function () {
      this.model.set('sync_on_data_change', false);
      spyOn(this.model, 'fetch');
      this.model.trigger('change:url', this.model);
      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should not fetch new data when url changes and dataview is disabled', function () {
      this.model.set('enabled', false);
      spyOn(this.model, 'fetch');
      this.model.trigger('change:url', this.model);
      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should fetch if url changes and forceFetch option is true, no matter rest of variables', function () {
      this.model.set('enabled', false);
      this.model.set('sync_on_data_change', false);
      spyOn(this.model, 'fetch');
      this.model.trigger('change:url', this.model, {}, { forceFetch: true });
      expect(this.model.fetch).toHaveBeenCalled();
      this.model.fetch.calls.reset();
      this.model.trigger('change:url', this.model, {}, { forceFetch: false });
      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should fetch if url changes and event was initiated by the same layer', function () {
      this.model.layer.get.and.returnValue('layerID');
      spyOn(this.model, 'fetch');

      this.model.set('url', 'http://somethingelese.com', {
        sourceLayerId: 'layerID'
      });

      expect(this.model.fetch).toHaveBeenCalled();
    });

    it('should not fetch if url changes and event was initiated by a different layer', function () {
      this.model.layer.get.and.returnValue('layerID');
      spyOn(this.model, 'fetch');

      this.model.trigger('change:url', this.model, {
        sourceLayerId: 'differentLayerId'
      });

      expect(this.model.fetch).not.toHaveBeenCalled();
    });
  });

  describe('when enabled is changed to true from false', function () {
    beforeEach(function () {
      this.model.fetch = function (opts) {
        opts.success();
      };
      this.model.set('url', 'http://example.com');

      this.model.set('enabled', false);

      spyOn(this.model, 'fetch');
    });

    it('should NOT fetch if nothing has changed', function () {
      this.model.set('enabled', true);

      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should fetch if the bounding box have changed while the dataview was disabled', function () {
      // Map bounds have changed
      this.map.getViewBounds.and.returnValue([102, 200], [300, 400]);
      this.map.trigger('change:center');

      this.model.set('enabled', true);

      expect(this.model.fetch).toHaveBeenCalled();

      this.model.fetch.calls.reset();

      // Disable and enable again
      this.model.set('enabled', false);
      this.model.set('enabled', true);

      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should NOT fetch if the bounding box have changed while the dataview was disabled and sync_on_bbox_change is disabled', function () {
      this.model.set('sync_on_bbox_change', false);

      // Map bounds have changed
      this.map.getViewBounds.and.returnValue([102, 200], [300, 400]);
      this.map.trigger('change:center');

      this.model.set('enabled', true);

      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should fetch if URL has changed while the dataview was disabled', function () {
      this.model.set('url', 'http://somethingelse.com');

      this.model.set('enabled', true);

      expect(this.model.fetch).toHaveBeenCalled();

      this.model.fetch.calls.reset();

      // Disable and enable again
      this.model.set('enabled', false);
      this.model.set('enabled', true);

      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should NOT fetch if a new instance of the windshaft map has been created while the dataview was disabled and sync_on_data_change is false', function () {
      this.model.set('sync_on_data_change', false);

      this.model.set('url', 'http://somethingelse.com');

      this.model.set('enabled', true);

      expect(this.model.fetch).not.toHaveBeenCalled();
    });
  });

  describe('bindings to map bounds', function () {
    beforeEach(function () {
      this.model.fetch = function (opts) {
        opts.success();
      };
      this.model.set('url', 'http://example.com');

      spyOn(this.model, 'fetch');
    });

    it('should fetch when the bounding box has changed', function () {
      this.map.getViewBounds.and.returnValue([102, 200], [300, 400]);
      this.map.trigger('change:center');

      expect(this.model.fetch).toHaveBeenCalled();
    });

    it('should NOT fetch when the bounding box has changed and the dataview is not enabled', function () {
      this.model.set('enabled', false);

      this.map.getViewBounds.and.returnValue([102, 200], [300, 400]);
      this.map.trigger('change:center');

      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should NOT fetch when the bounding box has changed and the dataview has sync_on_bbox_change disabled', function () {
      this.model.set('sync_on_bbox_change', false);

      this.map.getViewBounds.and.returnValue([102, 200], [300, 400]);
      this.map.trigger('change:center');

      expect(this.model.fetch).not.toHaveBeenCalled();
    });
  });

  describe('bindings to the filter', function () {
    beforeEach(function () {
      spyOn(this.map, 'reload');
      this.layer = new Backbone.Model({
        id: 'layerId'
      });
      this.layer.getDataProvider = jasmine.createSpy('getDataProvider').and.returnValue(undefined);
    });

    it('should reload the map by default when the filter changes', function () {
      var filter = new Backbone.Model();
      new DataviewModelBase(null, { // eslint-disable-line
        map: this.map,
        windshaftMap: this.windshaftMap,
        layer: this.layer,
        filter: filter
      });

      // Filter changes
      filter.trigger('change', filter);

      expect(this.map.reload).toHaveBeenCalledWith({ sourceLayerId: 'layerId' });
    });
  });

  describe('.remove', function () {
    beforeEach(function () {
      this.removeSpy = jasmine.createSpy('remove');
      this.model.once('destroy', this.removeSpy);
      spyOn(this.model, 'stopListening');
      this.model.filter = jasmine.createSpyObj('filter', ['remove']);
      this.model.remove();
    });

    it('should trigger a destroy event', function () {
      expect(this.removeSpy).toHaveBeenCalledWith(this.model);
    });

    it('should remove filter', function () {
      expect(this.model.filter.remove).toHaveBeenCalled();
    });

    it('should stop listening to events', function () {
      expect(this.model.stopListening).toHaveBeenCalled();
    });
  });

  describe('.update', function () {
    it('should only update the attrs set on ATTRS_NAMES', function () {
      this.model.update({ foo: 'bar' });
      expect(this.model.changedAttributes()).toBe(false);

      expect(this.model.get('sync_on_bbox_change')).toBe(true);
      this.model.update({
        sync_on_bbox_change: false,
        foo: 'bar'
      });
      expect(this.model.changedAttributes()).toEqual({
        sync_on_bbox_change: false
      });
    });
  });

  describe('.fetch', function () {
    it('should trigger a loading event', function () {
      spyOn(this.model, 'trigger');

      this.model.fetch();

      expect(this.model.trigger).toHaveBeenCalledWith('loading', this.model);
    });
  });

  describe('when the layer has a data provider', function () {
    var MyDataviewDataProvider = function () {};
    _.extend(MyDataviewDataProvider.prototype, Backbone.Events);
    MyDataviewDataProvider.prototype.getData = function () {
      return { a: 1 };
    };
    MyDataviewDataProvider.prototype.applyFilter = jasmine.createSpy('applyFilter');

    beforeEach(function () {
      this.geoJSONDataProvider = jasmine.createSpyObj('dataProvider', ['createDataProviderForDataview']);
      this.layer = new Backbone.Model({
        id: 'layerId'
      });
      this.layer.getDataProvider = function () {
        return this.geoJSONDataProvider;
      }.bind(this);

      this.dataviewDataProvider = new MyDataviewDataProvider();
      this.geoJSONDataProvider.createDataProviderForDataview.and.returnValue(this.dataviewDataProvider);
    });

    it('should set a dataProvider for the dataview', function () {
      var dataview = new DataviewModelBase({ // eslint-disable-line
        column: 'columnName'
      }, {
        map: this.map,
        windshaftMap: this.windshaftMap,
        layer: this.layer
      });

      expect(this.geoJSONDataProvider.createDataProviderForDataview).toHaveBeenCalledWith(dataview);
    });

    it('should get data from a data provider if present', function () {
      var dataview = new DataviewModelBase({ // eslint-disable-line
        column: 'columnName'
      }, {
        map: this.map,
        windshaftMap: this.windshaftMap,
        layer: this.layer
      });

      spyOn(dataview, 'parse').and.callFake(function () {
        return {
          b: 2
        };
      });

      dataview.fetch();

      expect(dataview.parse).toHaveBeenCalledWith({ a: 1 });
      expect(dataview.get('b')).toEqual(2);
    });

    it('should be bound to changes on the changes on the map bounds', function () {
      var dataview = new DataviewModelBase(null, {
        map: this.map,
        windshaftMap: this.windshaftMap,
        layer: this.layer
      });
      spyOn(dataview, 'parse').and.callFake(function () {
        return {
          b: 2
        };
      });

      // New data is available
      this.dataviewDataProvider.trigger('dataChanged');

      // Map bounds change
      this.map.getViewBounds.and.returnValue([100, 200], [300, 400]);
      this.map.trigger('change:center');

      expect(dataview.parse).toHaveBeenCalledWith({ a: 1 });
      expect(dataview.get('b')).toEqual(2);
    });

    it('should apply the filter to the data provider when the filter changes', function () {
      spyOn(this.map, 'reload');

      var filter = new Backbone.Model();
      var dataview = new DataviewModelBase({ // eslint-disable-line
        column: 'columnName'
      }, {
        map: this.map,
        windshaftMap: this.windshaftMap,
        layer: this.layer,
        filter: filter
      });

      // Filter changes
      filter.trigger('change', filter);

      expect(this.map.reload).not.toHaveBeenCalled();
      expect(this.dataviewDataProvider.applyFilter).toHaveBeenCalledWith(filter);
    });
  });

  describe('_getSourceId', function () {
    it('should return the layer ID', function () {
      var layer = new Backbone.Model({
        id: 'layerId'
      });
      layer.getDataProvider = jasmine.createSpy('getDataProvider').and.returnValue(undefined);

      var dataview = new DataviewModelBase(null, { // eslint-disable-line
        map: this.map,
        windshaftMap: this.windshaftMap,
        layer: layer
      });

      expect(dataview._getSourceId()).toEqual('layerId');
    });

    it("should return the ID of the layer's source", function () {
      var layer = new Backbone.Model({
        id: 'layerId',
        source: 'a1'
      });
      layer.getDataProvider = jasmine.createSpy('getDataProvider').and.returnValue(undefined);

      var dataview = new DataviewModelBase(null, { // eslint-disable-line
        map: this.map,
        windshaftMap: this.windshaftMap,
        layer: layer
      });

      expect(dataview._getSourceId()).toEqual('a1');
    });

    it("should return the sourceId", function () {
      var layer = new Backbone.Model({
        id: 'layerId',
        source: 'a1'
      });
      layer.getDataProvider = jasmine.createSpy('getDataProvider').and.returnValue(undefined);

      var dataview = new DataviewModelBase({
        sourceId: 'THE_SOURCE_ID'
      }, { // eslint-disable-line
        map: this.map,
        windshaftMap: this.windshaftMap,
        layer: layer
      });

      expect(dataview._getSourceId()).toEqual('THE_SOURCE_ID');
    });
  });
});
