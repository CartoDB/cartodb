var Backbone = require('backbone');
var _ = require('underscore');
var carto = require('../../../../../src/api/v4/index');
var createEngine = require('../../../fixtures/engine.fixture.js');

function createHistogramInternalModelMock (options) {
  options = options || {};
  _.extend({
    data: null,
    nulls: null
  }, options);
  var internalModelMock = {
    set: function () {},
    get: function () {},
    getUnfilteredDataModel: function () {},
    getUnfilteredData: function () {
      return [
        {
          freq: 23
        }, {
          freq: 46
        }, {
        }
      ];
    },
    getCurrentOffset: function () {
      return 7200;
    }
  };
  spyOn(internalModelMock, 'set');
  spyOn(internalModelMock, 'get').and.callFake(function (key) {
    if (key === 'data') {
      return options.data;
    }
    if (key === 'nulls') {
      return options.nulls;
    }
    if (key === 'totalAmount') {
      return 7654;
    }
  });
  spyOn(internalModelMock, 'getUnfilteredDataModel').and.returnValue({
    get: function (key) {
      if (key === 'nulls') {
        return 12;
      }
      if (key === 'totalAmount') {
        return 707;
      }
    }
  });
  _.extend(internalModelMock, Backbone.Events);

  return internalModelMock;
}

function createSourceMock () {
  return new carto.source.Dataset('ne_10m_populated_places_simple');
}

describe('api/v4/dataview/time-series', function () {
  var source = createSourceMock();

  describe('initialization', function () {
    it('source must be provided', function () {
      var test = function () {
        new carto.dataview.TimeSeries(); // eslint-disable-line no-new
      };

      expect(test).toThrowError(Error, 'Source property is required.');
    });

    it('column must be provided', function () {
      var test = function () {
        new carto.dataview.TimeSeries(source); // eslint-disable-line no-new
      };

      expect(test).toThrowError(Error, 'Column property is required.');
    });

    it('options set to default if not provided', function () {
      var column = 'population';

      var dataview = new carto.dataview.TimeSeries(source, column);

      expect(dataview._aggregation).toEqual(carto.dataview.timeAggregation.AUTO);
      expect(dataview._offset).toBe(0);
      expect(dataview._localTimezone).toBe(false);
    });

    it('options set to the provided value', function () {
      var dataview = new carto.dataview.TimeSeries(source, 'population', {
        aggregation: carto.dataview.timeAggregation.QUARTER,
        offset: -7,
        useLocalTimezone: true
      });

      expect(dataview._aggregation).toEqual(carto.dataview.timeAggregation.QUARTER);
      expect(dataview._offset).toBe(-7 * 3600); // Internaly stored in seconds
      expect(dataview._localTimezone).toBe(true);
    });

    it('throw error if aggregation is not a proper value', function () {
      var test = function () {
        new carto.dataview.TimeSeries(source, 'population', { // eslint-disable-line no-new
          aggregation: 'terasecond'
        });
      };

      expect(test).toThrowError(Error, 'Time aggregation must be a valid value. Use carto.dataview.timeAggregation.');
    });

    it('throw error if offset is not a valid hour', function () {
      var test = function () {
        new carto.dataview.TimeSeries(source, 'population', { // eslint-disable-line no-new
          offset: 34
        });
      };

      expect(test).toThrowError(Error, 'Offset must an integer value between -12 and 14.');

      test = function () {
        new carto.dataview.TimeSeries(source, 'population', { // eslint-disable-line no-new
          offset: 10.45
        });
      };

      expect(test).toThrowError(Error, 'Offset must an integer value between -12 and 14.');
    });

    it('throw error if localTimezone is not a binary value', function () {
      var test = function () {
        new carto.dataview.TimeSeries(source, 'population', { // eslint-disable-line no-new
          useLocalTimezone: 'Los Angeles'
        });
      };

      expect(test).toThrowError(Error, 'useLocalTimezone must be a boolean value.');
    });
  });

  describe('.getData', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.TimeSeries(source, 'population');
    });

    it('returns null if there is no internalModel', function () {
      var data = dataview.getData();

      expect(data).toBeNull();
    });

    it('returns parsed data from the internal model', function () {
      dataview._internalModel = createHistogramInternalModelMock({
        data: [
          {
            freq: 35
          }, {
            freq: 50
          }, {
          }
        ],
        nulls: 42
      });

      var data = dataview.getData();

      expect(data.bins.length).toBe(3);
      expect(data.bins[0].freq).toBe(35);
      expect(data.bins[1].freq).toBe(50);
      expect(data.bins[2].freq).toBeUndefined();
      expect(data.bins[0].normalized).toBe(0.7);
      expect(data.bins[1].normalized).toBe(1);
      expect(data.bins[2].normalized).toBe(0);
      expect(data.nulls).toBe(42);
      expect(data.totalAmount).toBe(7654);
      expect(data.offset).toBe(2);
    });

    it('returns nulls as 0 in case the internal model has no nulls', function () {
      dataview._internalModel = createHistogramInternalModelMock({
        data: [
          {
            freq: 35
          }, {
            freq: 50
          }, {
          }
        ],
        nulls: undefined
      });

      var data = dataview.getData();

      expect(data.bins.length).toBe(3);
      expect(data.bins[0].freq).toBe(35);
      expect(data.bins[1].freq).toBe(50);
      expect(data.bins[2].freq).toBeUndefined();
      expect(data.bins[0].normalized).toBe(0.7);
      expect(data.bins[1].normalized).toBe(1);
      expect(data.bins[2].normalized).toBe(0);
      expect(data.nulls).toBe(0);
      expect(data.totalAmount).toBe(7654);
    });

    it('returns null if internal model has no data', function () {
      dataview._internalModel = createHistogramInternalModelMock();

      var data = dataview.getData();

      expect(data).toBe(null);
    });
  });

  describe('.setAggregation', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.TimeSeries(source, 'population');
    });

    it('should validate aggregation', function () {
      var test = function () {
        dataview.setAggregation('terasecond');
      };

      expect(test).toThrowError(Error, 'Time aggregation must be a valid value. Use carto.dataview.timeAggregation.');
    });

    it('should set aggregation to internal model as well', function () {
      dataview._internalModel = createHistogramInternalModelMock();

      dataview.setAggregation(carto.dataview.timeAggregation.HOUR);

      expect(dataview._internalModel.set).toHaveBeenCalledWith('aggregation', carto.dataview.timeAggregation.HOUR);
      expect(dataview.getAggregation()).toBe('hour');

      // Clean
      dataview._internalModel = null;
    });

    it('should Trigger a aggregationChanged event when the aggregation are changed', function () {
      var aggregationChangedSpy = jasmine.createSpy('aggregationChangedSpy');
      dataview.on('aggregationChanged', aggregationChangedSpy);

      expect(aggregationChangedSpy).not.toHaveBeenCalled();
      dataview.$setEngine(createEngine());
      dataview.setAggregation(carto.dataview.timeAggregation.HOUR);

      expect(aggregationChangedSpy).toHaveBeenCalledWith(carto.dataview.timeAggregation.HOUR);
    });
  });

  describe('.setOffset', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.TimeSeries(source, 'population');
    });

    it('should validate offset', function () {
      var test = function () {
        dataview.setOffset(32);
      };

      expect(test).toThrowError(Error, 'Offset must an integer value between -12 and 14.');

      test = function () {
        dataview.setOffset(10.7);
      };

      expect(test).toThrowError(Error, 'Offset must an integer value between -12 and 14.');
    });

    it('should set offset to internal model as well translated to seconds', function () {
      dataview._internalModel = createHistogramInternalModelMock();

      dataview.setOffset(-5);

      expect(dataview._internalModel.set).toHaveBeenCalledWith('offset', -5 * 3600);
      expect(dataview.getOffset()).toBe(-5);

      // Clean
      dataview._internalModel = null;
    });
  });

  describe('.useLocalTimezone', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.TimeSeries(source, 'population');
    });

    it('should validate localTimezone', function () {
      var test = function () {
        dataview.useLocalTimezone('Compton');
      };

      expect(test).toThrowError(Error, 'useLocalTimezone must be a boolean value.');
    });

    it('should set localTimezone to internal model as well', function () {
      dataview._internalModel = createHistogramInternalModelMock();

      dataview.useLocalTimezone(true);

      expect(dataview._internalModel.set).toHaveBeenCalledWith('localTimezone', true);
      expect(dataview.isUsingLocalTimezone()).toBe(true);

      // Clean
      dataview._internalModel = null;
    });
  });

  describe('.$setEngine', function () {
    var engine;
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.TimeSeries(source, 'population');
      engine = createEngine();
    });

    it('creates the internal model', function () {
      var filter = new carto.filter.BoundingBox();
      dataview.disable(); // To test that it passes the ._enabled property to the internal model
      dataview.setAggregation(carto.dataview.timeAggregation.WEEK);
      dataview.setOffset(6);
      dataview.useLocalTimezone(true);
      dataview.addFilter(filter);
      dataview.$setEngine(engine);

      var internalModel = dataview.$getInternalModel();
      expect(internalModel.get('source')).toBe(dataview._source.$getInternalModel());
      expect(internalModel.get('column')).toEqual(dataview._column);
      expect(internalModel.get('aggregation')).toBe('week');
      expect(internalModel.get('localTimezone')).toBe(true);
      expect(internalModel.get('offset')).toBe(6 * 3600);
      expect(internalModel.isEnabled()).toBe(false);
      expect(internalModel._bboxFilter).toBeDefined();
      expect(internalModel.syncsOnBoundingBoxChanges()).toBe(true);
      expect(internalModel._engine).toBe(engine);
    });

    it('creates the internal model with no bounding box if not provided', function () {
      dataview.$setEngine(engine);

      var internalModel = dataview.$getInternalModel();
      expect(internalModel._bboxFilter).not.toBeDefined();
      expect(internalModel.syncsOnBoundingBoxChanges()).toBe(false);
    });

    it('calling twice to $setEngine does not create another internalModel', function () {
      spyOn(dataview, '_createInternalModel').and.callThrough();

      dataview.$setEngine(engine);
      dataview.$setEngine(engine);

      expect(dataview._createInternalModel.calls.count()).toBe(1);
    });
  });
});
