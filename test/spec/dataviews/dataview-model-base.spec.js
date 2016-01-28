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
      layer: jasmine.createSpyObj('layer', ['get'])
    });
  });

  it('should listen to a url attribute change at the beginning', function () {
    spyOn(this.model, 'once').and.callThrough();
    this.model._initBinds(); // _initBinds is called when object is created, so
    // it is necessary to called again to have the spy
    // correctly set.
    expect(this.model.once.calls.argsFor(0)[0]).toEqual('change:url');
  });

  it('should add binds for url and bbox changes after first load', function () {
    spyOn(this.model, 'bind').and.callThrough();
    this.model.fetch = function (opts) {
      opts.success();
    };
    this.model.set('url', 'newurl');
    expect(this.model.bind.calls.argsFor(0)[0]).toEqual('change:url');
    expect(this.model.bind.calls.argsFor(1)[0]).toEqual('change:boundingBox');
  });

  describe('after first load', function () {
    beforeEach(function () {
      this.model.fetch = function (opts) {
        opts.success();
      };
      this.model.set('url', 'newurl');
    });

    it('should not fetch new data when url changes and syncData is disabled', function () {
      this.model.set('syncData', false);
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
      this.model.set('syncBoundingBox', false);
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

  it('should trigger loading event when fetch is launched', function () {
    spyOn(this.model, 'trigger');
    this.model.fetch();
    expect(this.model.trigger).toHaveBeenCalledWith('loading', this.model);
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

    it('should trigger a change:url event if the sourceLayerId matches the id of the dataview\'s layer', function () {
      var callback = jasmine.createSpy('callback');
      this.model.bind('change:url', callback);
      this.model.layer.get.and.returnValue('123456789');

      this.windshaftMap.trigger('instanceCreated', this.windshaftMap, '123456789');

      expect(callback).toHaveBeenCalled();
    });

    it('should NOT trigger a change:url event if the sourceLayerId doesn\'t match the id of the dataview\'s layer', function () {
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

    it('should NOT update the bounding box when map bounds change and URL hasn\'t been set yet', function () {
      var previousBoundingBox = this.model.get('boundingBox');

      this.map.getViewBounds.and.returnValue([100, 200], [300, 400]);
      this.map.trigger('change:center');

      expect(this.model.get('boundingBox')).toEqual(previousBoundingBox);
    });

    it('should update the bounding box when map bounds change and URL has been set', function () {
      spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });

      var previousBoundingBox = this.model.get('boundingBox');

      this.model._onChangeBinds();

      this.map.getViewBounds.and.returnValue([[100, 200], [300, 400]]);
      this.map.trigger('change:center');

      expect(this.model.get('boundingBox')).not.toEqual(previousBoundingBox);
      expect(this.model.get('boundingBox')).toEqual('200,100,400,300');
    });
  });
});
