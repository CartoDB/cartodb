var _ = require('underscore');
var Backbone = require('backbone');
var DataviewModelBase = require('../../../src/dataviews/dataview-model-base');

describe('dataviews/dataview-model-base', function () {
  beforeEach(function () {
    this.map = new Backbone.Model();
    this.map.getViewBounds = function () {};
    this.map.reload = function () {};
    spyOn(this.map, 'getViewBounds').and.returnValue([[1, 2], [3, 4]]);

    this.windshaftMap = new Backbone.Model();

    this.model = new DataviewModelBase(null, {
      map: this.map,
      windshaftMap: this.windshaftMap,
      layer: jasmine.createSpyObj('layer', ['get', 'getDataProvider'])
    });
    this.model.toJSON = jasmine.createSpy('toJSON').and.returnValue({});
  });

  describe('when url changes', function () {
    beforeEach(function () {
      spyOn(this.model, '_fetch');
      spyOn(this.model, 'listenTo');
      spyOn(this.model, 'on');
      this.model.set('url', 'new-url');
    });

    it('should fetch', function () {
      expect(this.model._fetch).toHaveBeenCalled();
    });

    describe('when fetch succeeds', function () {
      beforeEach(function () {
        this.model._fetch.calls.argsFor(0)[0]();
      });

      it('should change bounds', function () {
        expect(this.model.listenTo.calls.argsFor(0)[0]).toEqual(this.model._map);
        expect(this.model.listenTo.calls.argsFor(0)[1]).toEqual('change:center change:zoom');
        expect(this.model.on.calls.argsFor(0)[0]).toEqual('change:url');
        expect(this.model.on.calls.argsFor(1)[0]).toEqual('change:boundingBox');
        expect(this.model.on.calls.argsFor(2)[0]).toEqual('change:enabled');
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

    it('should not fetch new data when bbox changes and bbox is disabled', function () {
      this.model.set('sync_on_bbox_change', false);
      spyOn(this.model, 'fetch');
      this.model.trigger('change:boundingBox', this.model);
      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should not fetch new data when bbox changes and dataview is disabled', function () {
      this.model.set('enabled', false);
      spyOn(this.model, 'fetch');
      this.model.trigger('change:boundingBox', this.model);
      expect(this.model.fetch).not.toHaveBeenCalled();
    });
  });

  describe('when disabled', function () {
    it('should fetch again when disabled is disabled and url or boundingBox has changed', function () {
      spyOn(this.model, '_fetch');
      this.model.set('enabled', false);
      this.model.set('url', 'hello');
      this.model.set('enabled', true);
      expect(this.model._fetch).toHaveBeenCalled();
    });

    it('should not fetch when disabled is enabled', function () {
      spyOn(this.model, '_fetch');
      this.model.set('enabled', false);
      expect(this.model._fetch).not.toHaveBeenCalled();
    });
  });

  describe('bindings to windhsaftMap', function () {
    beforeEach(function () {
      this.windshaftMap.getDataviewURL = function () {};
      spyOn(this.windshaftMap, 'getDataviewURL').and.returnValue('http://wadus.com');
    });

    it('should update the url attribute when a new windshaftMap instance have been created', function () {
      this.windshaftMap.trigger('instanceCreated', this.windshaftMap, {});

      expect(this.model.get('url')).toEqual('http://wadus.com');
    });

    it("should trigger a change:url event if the sourceLayerId matches the id of the dataview's layer", function () {
      var callback = jasmine.createSpy('callback');
      this.model.bind('change:url', callback);
      this.model.layer.get.and.returnValue('123456789');

      this.windshaftMap.trigger('instanceCreated', this.windshaftMap, '123456789');

      expect(callback).toHaveBeenCalled();
    });

    it("should NOT trigger a change:url event if the sourceLayerId doesn't match the id of the dataview's layer", function () {
      var callback = jasmine.createSpy('callback');
      this.model.bind('change:url', callback);
      this.model.layer.get.and.returnValue('123456789');

      this.windshaftMap.trigger('instanceCreated', this.windshaftMap, '987654321');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('bindings to map', function () {
    beforeEach(function () {
      spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });
    });

    it("should NOT update the bounding box when map bounds change and URL hasn't been set yet", function () {
      var previousBoundingBox = this.model.get('boundingBox');

      this.map.getViewBounds.and.returnValue([100, 200], [300, 400]);
      this.map.trigger('change:center');

      expect(this.model.get('boundingBox')).toEqual(previousBoundingBox);
    });

    it('should update the bounding box when map bounds change and URL has been set', function () {
      var previousBoundingBox = this.model.get('boundingBox');

      this.model._onChangeBinds();

      this.map.getViewBounds.and.returnValue([[100, 200], [300, 400]]);
      this.map.trigger('change:center');

      expect(this.model.get('boundingBox')).not.toEqual(previousBoundingBox);
      expect(this.model.get('boundingBox')).toEqual('200,100,400,300');
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

    it('should apply the filter to the data provider when the filter changes', function () {
      // Set up a new data provider
      var dataProvider = new Backbone.Model();
      dataProvider.generateDataForDataview = function (dataview, data) {
        return data[0];
      };
      dataProvider.applyFilter = jasmine.createSpy('applyFilter');

      // Layer has a dataProvider
      this.layer.getDataProvider.and.returnValue(dataProvider);

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
      expect(dataProvider.applyFilter).toHaveBeenCalledWith('columnName', filter);
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

  describe('when the layer has a data provider', function () {
    it('it should get data from that provider when features changed', function () {
      var layer = new Backbone.Model();
      var dataProvider = new Backbone.Model();
      dataProvider.generateDataForDataview = function (dataview, data) {
        return data[0];
      };
      layer.getDataProvider = function () {
        return dataProvider;
      };

      var dataview = new DataviewModelBase(null, {
        map: this.map,
        windshaftMap: this.windshaftMap,
        layer: layer
      });

      // The dataProvider triggers a featuresChanged event with some features
      dataProvider.trigger('featuresChanged', [{ a: 'b' }]);

      // The dataview has been updated and events have been triggered
      expect(dataview.get('a')).toEqual('b');

      // The dataProvider triggers a featuresChanged event with some features
      dataProvider.trigger('featuresChanged', [{ c: 'd' }]);

      // The dataview has been updated and events have been triggered
      expect(dataview.get('c')).toEqual('d');
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
    it('should fetch from the url by default', function () {
      spyOn(this.model, 'trigger');
      this.model.fetch();
      expect(this.model.trigger).toHaveBeenCalledWith('loading', this.model);
    });

    it('should get data from a data provider if present', function () {
      this.layer = new Backbone.Model({
        id: 'layerId'
      });

      // Set up a new data provider
      var dataProvider = new Backbone.Model();
      dataProvider.getData = jasmine.createSpy('getData').and.callFake(function () {
        return [{ a: 'b' }, { b: 'c' }];
      });

      dataProvider.generateDataForDataview = jasmine.createSpy('generateDataForDataview').and.callFake(function (dataview, data) {
        return {
          something: 'else'
        };
      });

      // Layer has a dataProvider
      this.layer.getDataProvider = jasmine.createSpy('getDataProvider').and.returnValue(dataProvider);

      var dataview = new DataviewModelBase({ // eslint-disable-line
        column: 'columnName'
      }, {
        map: this.map,
        windshaftMap: this.windshaftMap,
        layer: this.layer
      });

      spyOn(dataview, 'parse').and.callFake(function () {
        return {
          else: 'something'
        };
      });

      var syncCallback = jasmine.createSpy('syncCallback');
      dataview.bind('sync', syncCallback);

      dataview.fetch();

      expect(dataProvider.generateDataForDataview).toHaveBeenCalledWith(dataview, [{ a: 'b' }, { b: 'c' }]);
      expect(dataview.parse).toHaveBeenCalledWith({ something: 'else' });
      expect(dataview.get('else')).toEqual('something');
      expect(syncCallback).toHaveBeenCalled();
    });
  });
});
