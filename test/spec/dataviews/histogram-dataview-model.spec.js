var Model = require('../../../src/core/model');
var RangeFilter = require('../../../src/windshaft/filters/range');
var HistogramDataviewModel = require('../../../src/dataviews/histogram-dataview-model');

describe('dataviews/histogram-dataview-model', function () {
  beforeEach(function () {
    this.map = jasmine.createSpyObj('map', ['getViewBounds', 'bind', 'reload']);
    this.map.getViewBounds.and.returnValue([[1, 2], [3, 4]]);
    this.filter = new RangeFilter();
    this.layer = new Model();
    this.layer.getDataProvider = function () {};
    spyOn(HistogramDataviewModel.prototype, 'listenTo').and.callThrough();
    spyOn(HistogramDataviewModel.prototype, 'fetch').and.callThrough();
    this.model = new HistogramDataviewModel({}, {
      map: this.map,
      layer: this.layer,
      filter: this.filter
    });
  });

  it('should not listen any url change from the beginning', function () {
    this.model.set('url', 'http://cartodb.com');
    expect(this.model.fetch).not.toHaveBeenCalled();
  });

  it('should set unfiltered model url when model has changed it', function () {
    spyOn(this.model._unfilteredData, 'setUrl');
    this.model.set('url', 'hey!');
    expect(this.model._unfilteredData.setUrl).toHaveBeenCalled();
  });

  it('should set the api_key attribute on the internal models', function () {
    this.model = new HistogramDataviewModel({
      apiKey: 'API_KEY'
    }, {
      map: this.map,
      layer: jasmine.createSpyObj('layer', ['get', 'getDataProvider']),
      filter: this.filter
    });

    expect(this.model._unfilteredData.get('apiKey')).toEqual('API_KEY');
  });

  describe('should get the correct histogram shape', function () {
    beforeEach(function () {
      this.model.set('bins', 6);
    });
    it('when it is flat', function () {
      this.model.set('data', [
        {bin: 0, freq: 25},
        {bin: 1, freq: 26},
        {bin: 2, freq: 25},
        {bin: 3, freq: 26},
        {bin: 4, freq: 26},
        {bin: 5, freq: 25}
      ]);
      expect(this.model.getHistogramShape()).toEqual('F');
    });
    it('when it is A', function () {
      this.model.set('data', [
        {bin: 0, freq: 0},
        {bin: 1, freq: 5},
        {bin: 2, freq: 25},
        {bin: 3, freq: 18},
        {bin: 4, freq: 8},
        {bin: 5, freq: 2}
      ]);
      expect(this.model.getHistogramShape()).toEqual('A');
    });
    it('when it is J', function () {
      this.model.set('data', [
        {bin: 0, freq: 0},
        {bin: 1, freq: 2},
        {bin: 2, freq: 5},
        {bin: 3, freq: 8},
        {bin: 4, freq: 18},
        {bin: 5, freq: 25}
      ]);
      expect(this.model.getHistogramShape()).toEqual('J');
    });
    it('when it is L', function () {
      this.model.set('data', [
        {bin: 0, freq: 25},
        {bin: 1, freq: 18},
        {bin: 4, freq: 8},
        {bin: 2, freq: 5},
        {bin: 5, freq: 2},
        {bin: 3, freq: 0}
      ]);
      expect(this.model.getHistogramShape()).toEqual('L');
    });
    xit('when it is clustered', function () {
      this.model.set('data', [
       {bin: 0, freq: 20},
       {bin: 1, freq: 18},
       {bin: 2, freq: 5},
       {bin: 3, freq: 0},
       {bin: 4, freq: 32},
       {bin: 5, freq: 16}
      ]);
      expect(this.model.getHistogramShape()).toEqual('C');
    });
  });

  describe('on unfiltered data model fetch', function () {
    beforeEach(function () {
      var histogramData = {
        'bin_width': 10,
        'bins_count': 3,
        'bins_start': 1,
        'nulls': 0
      };

      spyOn(this.model._unfilteredData, 'sync').and.callFake(function (method, model, options) {
        options.success(histogramData);
      });
    });

    it('should calculate start, end and bins', function () {
      expect(this.model.get('start')).toBeUndefined();
      expect(this.model.get('end')).toBeUndefined();
      this.model._unfilteredData.fetch();
      expect(this.model.get('start')).toEqual(1);
      expect(this.model.get('end')).toEqual(31);
      expect(this.model.get('bins')).toEqual(3);
    });

    it('should run _onChangeBins', function () {
      spyOn(this.model, '_onChangeBinds');
      this.model._unfilteredData.fetch();
      expect(this.model._onChangeBinds).toHaveBeenCalled();
    });
  });

  describe('when column changes', function () {
    it('should reload map and force fetch', function () {
      this.map.reload.calls.reset();
      this.model.set('column', 'random_col');
      expect(this.map.reload).toHaveBeenCalledWith({ forceFetch: true, sourceLayerId: undefined });
    });
  });

  describe('when bins change', function () {
    beforeEach(function () {
      this.map.reload.calls.reset();
      spyOn(this.model.filter, 'unsetRange');
      this.model.set('bins', 123);
    });

    it('should refresh data on bins change', function () {
      expect(this.map.reload).not.toHaveBeenCalled();
      expect(this.model.fetch).toHaveBeenCalled();
    });

    it('should disable filter', function () {
      expect(this.model.get('own_filter')).toBeUndefined();
    });

    it('should unset range filter', function () {
      expect(this.model.filter.unsetRange).toHaveBeenCalled();
    });
  });

  describe('when start change', function () {
    beforeEach(function () {
      this.map.reload.calls.reset();
      spyOn(this.model.filter, 'unsetRange');

      this.model.set('start', 0);
    });

    it('should refresh data on bins change', function () {
      expect(this.map.reload).not.toHaveBeenCalled();
      expect(this.model.fetch).toHaveBeenCalled();
    });

    it('should disable filter', function () {
      expect(this.model.get('own_filter')).toBeUndefined();
    });

    it('should unset range filter', function () {
      expect(this.model.filter.unsetRange).toHaveBeenCalled();
    });
  });

  describe('when end change', function () {
    beforeEach(function () {
      this.map.reload.calls.reset();
      spyOn(this.model.filter, 'unsetRange');
      this.model.set('end', 0);
    });

    it('should refresh data on bins change', function () {
      expect(this.map.reload).not.toHaveBeenCalled();
      expect(this.model.fetch).toHaveBeenCalled();
    });

    it('should disable filter', function () {
      expect(this.model.get('own_filter')).toBeUndefined();
    });

    it('should unset range filter', function () {
      expect(this.model.filter.unsetRange).toHaveBeenCalled();
    });
  });

  it('should parse the bins', function () {
    var data = {
      bin_width: 14490.25,
      bins: [
        { bin: 0, freq: 2, max: 70151, min: 55611 },
        { bin: 1, freq: 2, max: 79017, min: 78448 },
        { bin: 3, freq: 1, max: 113572, min: 113572 }
      ],
      bins_count: 4,
      bins_start: 55611,
      nulls: 0,
      type: 'histogram'
    };

    this.model.parse(data);

    var parsedData = this.model.getData();

    expect(data.nulls).toBe(0);
    expect(parsedData.length).toBe(4);
    expect(JSON.stringify(parsedData)).toBe('[{"bin":0,"start":55611,"end":70101.25,"freq":2,"max":70151,"min":55611},{"bin":1,"start":70101.25,"end":84591.5,"freq":2,"max":79017,"min":78448},{"bin":2,"start":84591.5,"end":99081.75,"freq":0},{"bin":3,"start":99081.75,"end":113572,"freq":1,"max":113572,"min":113572}]');
  });

  it('parser do not fails when there are no bins', function () {
    var data = {
      bin_width: 0,
      bins: [],
      bins_count: 0,
      bins_start: 0,
      nulls: 0,
      type: 'histogram'
    };

    this.model.parse(data);

    var parsedData = this.model.getData();

    expect(data.nulls).toBe(0);
    expect(parsedData.length).toBe(0);
  });

  it('should parse the bins and fix end bucket issues', function () {
    var data = {
      'bin_width': 1041.66645833333,
      'bins_count': 48,
      'bins_start': 0.01,
      'nulls': 0,
      'avg': 55.5007561961441,
      'bins': [{
        'bin': 47,
        'min': 50000,
        'max': 50000,
        'avg': 50000,
        'freq': 6
        // NOTE - The end of this bucket is 48 * 1041.66645833333 = 49999.98999999984
        // but it must be corrected to 50.000.
      }],
      'type': 'histogram'
    };

    this.model.parse(data);

    var parsedData = this.model.getData();

    expect(data.nulls).toBe(0);
    expect(parsedData.length).toBe(48);
    expect(parsedData[47].end).not.toBeLessThan(parsedData[47].max);
  });

  describe('when layer changes meta', function () {
    beforeEach(function () {
      expect(this.model.filter.get('column_type')).not.toEqual('date');
      this.model.layer.set({
        meta: {
          column_type: 'date'
        }
      });
    });

    it('should change the filter column_type', function () {
      expect(this.model.filter.get('column_type')).toEqual('date');
    });
  });

  describe('.url', function () {
    it('should include bbox and initial bins', function () {
      this.model.set('url', 'http://example.com');
      expect(this.model.url()).toEqual('http://example.com?bbox=2,1,4,3&bins=10');
    });
    it('should include start, end and bins when own_filter is enabled', function () {
      this.model.set({
        'url': 'http://example.com',
        'start': 0,
        'end': 10,
        'bins': 25
      });
      expect(this.model.url()).toEqual('http://example.com?bbox=2,1,4,3&start=0&end=10&bins=25');
      this.model.enableFilter();
      expect(this.model.url()).toEqual('http://example.com?bbox=2,1,4,3&own_filter=1');
    });
  });

  describe('.enableFilter', function () {
    it('should set the own_filter attribute', function () {
      expect(this.model.get('own_filter')).toBeUndefined();

      this.model.enableFilter();

      expect(this.model.get('own_filter')).toEqual(1);
    });
  });

  describe('.disabeFilter', function () {
    it('should unset the own_filter attribute', function () {
      this.model.enableFilter();
      this.model.disableFilter();

      expect(this.model.get('own_filter')).toBeUndefined();
    });
  });
});
