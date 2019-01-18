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

describe('api/v4/dataview/histogram', function () {
  var source = createSourceMock();

  describe('initialization', function () {
    it('source must be provided', function () {
      var test = function () {
        new carto.dataview.Histogram(); // eslint-disable-line no-new
      };

      expect(test).toThrowError(Error, 'Source property is required.');
    });

    it('column must be provided', function () {
      var test = function () {
        new carto.dataview.Histogram(source); // eslint-disable-line no-new
      };

      expect(test).toThrowError(Error, 'Column property is required.');
    });

    it('options set to default if not provided', function () {
      var column = 'population';

      var dataview = new carto.dataview.Histogram(source, column);

      expect(dataview._bins).toEqual(10);
    });

    it('options set to the provided value', function () {
      var dataview = new carto.dataview.Histogram(source, 'population', {
        bins: 808
      });

      expect(dataview._bins).toEqual(808);
    });

    it('throw error if bins is not a positive integer value', function () {
      var test = function () {
        new carto.dataview.Histogram(source, 'population', { // eslint-disable-line no-new
          bins: 0
        });
      };

      expect(test).toThrowError(Error, 'Bins must be a positive integer value.');
    });

    it('throw error if start is present but not end', function () {
      var test = function () {
        new carto.dataview.Histogram(source, 'population', { // eslint-disable-line no-new
          start: 10
        });
      };

      expect(test).toThrowError(Error, 'Both start and end values must be a number or null.');
    });

    it('throw error if end is present but not start', function () {
      var test = function () {
        new carto.dataview.Histogram(source, 'population', { // eslint-disable-line no-new
          end: 10
        });
      };

      expect(test).toThrowError(Error, 'Both start and end values must be a number or null.');
    });
  });

  describe('.getData', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Histogram(source, 'population');
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

  describe('.setBins', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Histogram(source, 'population');
    });

    it('should validate bins', function () {
      var test = function () {
        dataview.setBins(-1);
      };

      expect(test).toThrowError(Error, 'Bins must be a positive integer value.');
    });

    it('should throw error if called with a float number', function () {
      var test = function () {
        dataview.setBins(15.7);
      };

      expect(test).toThrowError(Error, 'Bins must be a positive integer value.');
    });

    it('should set bins to internal model as well', function () {
      dataview._internalModel = createHistogramInternalModelMock();

      dataview.setBins(16);

      expect(dataview._internalModel.set).toHaveBeenCalledWith('bins', 16);
      expect(dataview.getBins()).toBe(16); // We assert .getBins() as well

      // Clean
      dataview._internalModel = null;
    });

    it('should Trigger a binsChanged event when the bins are changed', function () {
      var binsChangedSpy = jasmine.createSpy('binsChangedSpy');
      dataview.on('binsChanged', binsChangedSpy);

      expect(binsChangedSpy).not.toHaveBeenCalled();
      dataview.$setEngine(createEngine());
      dataview.setBins(11);

      expect(binsChangedSpy).toHaveBeenCalledWith(11);
    });
  });

  describe('.setStartEnd', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Histogram(source, 'population');
    });

    it('should throw an error if only start is present', function () {
      var test = function () {
        dataview.setStartEnd(20, null);
      };

      expect(test).toThrowError(Error, 'Both start and end values must be a number or null.');
    });

    it('should throw an error if only end is present', function () {
      var test = function () {
        dataview.setStartEnd(null, 30);
      };

      expect(test).toThrowError(Error, 'Both start and end values must be a number or null.');
    });

    it('should set start and end with a number', function () {
      dataview._internalModel = createHistogramInternalModelMock();

      dataview.setStartEnd(20, 30);

      expect(dataview._internalModel.set).toHaveBeenCalledWith({ start: 20, end: 30 });
      expect(dataview.getStart()).toBe(20); // We assert .getStart() as well
      expect(dataview.getEnd()).toBe(30); // We assert .getEnd() as well

      // Clean
      dataview._internalModel = null;
    });

    it('should set start and end with null', function () {
      dataview._internalModel = createHistogramInternalModelMock();

      dataview.setStartEnd(null, null);

      expect(dataview._internalModel.set).toHaveBeenCalledWith({ start: null, end: null });
      expect(dataview.getStart()).toBe(undefined); // We assert .getStart() as well
      expect(dataview.getEnd()).toBe(undefined); // We assert .getEnd() as well

      // Clean
      dataview._internalModel = null;
    });

    it('should trigger a startChanged event when the start is changed', function () {
      var startChangedSpy = jasmine.createSpy('startChangedSpy');
      dataview.on('startChanged', startChangedSpy);

      expect(startChangedSpy).not.toHaveBeenCalled();
      dataview.$setEngine(createEngine());
      dataview.setStartEnd(20, 30);

      expect(startChangedSpy).toHaveBeenCalledWith(20);
    });

    it('should trigger a endChanged event when the end is changed', function () {
      var endChangedSpy = jasmine.createSpy('endChangedSpy');
      dataview.on('endChanged', endChangedSpy);

      expect(endChangedSpy).not.toHaveBeenCalled();
      dataview.$setEngine(createEngine());
      dataview.setStartEnd(20, 30);

      expect(endChangedSpy).toHaveBeenCalledWith(30);
    });
  });

  describe('.$setEngine', function () {
    var engine;
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Histogram(source, 'population');
      engine = createEngine();
    });

    it('creates the internal model', function () {
      var filter = new carto.filter.BoundingBox();
      dataview.disable(); // To test that it passes the ._enabled property to the internal model
      dataview.setBins(15);
      dataview.addFilter(filter);
      dataview.$setEngine(engine);

      var internalModel = dataview.$getInternalModel();
      expect(internalModel.get('source')).toBe(dataview._source.$getInternalModel());
      expect(internalModel.get('column')).toEqual(dataview._column);
      expect(internalModel.get('bins')).toBe(15);
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

  describe('.getDistributionType', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Histogram(source, 'population');
    });

    it('should return null if there is no internal model', function () {
      var distribution = dataview.getDistributionType();

      expect(distribution).toBe(null);
    });

    it('should call to the proper method in internal model', function () {
      var internalModel = {
        getData: function () {},
        getDistributionType: function () {}
      };
      spyOn(internalModel, 'getData').and.returnValue('token');
      spyOn(internalModel, 'getDistributionType').and.returnValue('a');
      dataview._internalModel = internalModel;

      var distribution = dataview.getDistributionType();

      expect(internalModel.getDistributionType).toHaveBeenCalledWith('token');
      expect(distribution).toEqual('a');
    });
  });
});
