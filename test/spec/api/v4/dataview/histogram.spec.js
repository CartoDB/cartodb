var Backbone = require('backbone');
var _ = require('underscore');
var carto = require('../../../../../src/api/v4/index');

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
  return new carto.source.Dataset();
}

function createEngineMock () {
  var engine = {
    name: 'Engine mock',
    reload: function () {}
  };
  spyOn(engine, 'reload');

  return engine;
}

describe('api/v4/dataview/histogram', function () {
  var source = createSourceMock();

  describe('initialization', function () {
    it('source must be provided', function () {
      var test = function () {
        new carto.dataview.Histogram(); // eslint-disable-line no-new
      };

      expect(test).toThrowError(TypeError, 'Source property is required.');
    });

    it('column must be provided', function () {
      var test = function () {
        new carto.dataview.Histogram(source); // eslint-disable-line no-new
      };

      expect(test).toThrowError(TypeError, 'Column property is required.');
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

    it('throw error if no correct operation is provided', function () {
      var test = function () {
        new carto.dataview.Histogram(source, 'population', { // eslint-disable-line no-new
          bins: 0
        });
      };

      expect(test).toThrowError(TypeError, 'Bins must be a positive value.');
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

      expect(data.result.length).toBe(3);
      expect(data.result[0].freq).toBe(35);
      expect(data.result[1].freq).toBe(50);
      expect(data.result[2].freq).toBeUndefined();
      expect(data.result[0].normalized).toBe(0.7);
      expect(data.result[1].normalized).toBe(1);
      expect(data.result[2].normalized).toBe(0);
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
        nulls: 42
      });

      var data = dataview.getData();

      expect(data.result.length).toBe(3);
      expect(data.result[0].freq).toBe(35);
      expect(data.result[1].freq).toBe(50);
      expect(data.result[2].freq).toBeUndefined();
      expect(data.result[0].normalized).toBe(0.7);
      expect(data.result[1].normalized).toBe(1);
      expect(data.result[2].normalized).toBe(0);
      expect(data.nulls).toBe(42);
      expect(data.totalAmount).toBe(7654);
    });

    it('returns null if internal model has no data', function () {
      dataview._internalModel = createHistogramInternalModelMock();

      var data = dataview.getData();

      expect(data).toBe(null);
    });
  });

  describe('.getTotalsData', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Histogram(source, 'population');
    });

    it('should return null if there is no internal model', function () {
      var data = dataview.getTotalsData();

      expect(data).toBe(null);
    });

    it('should return null if there is internal model but no totals', function () {
      dataview._internalModel = createHistogramInternalModelMock();
      dataview._internalModel.getUnfilteredData = function () { return null; };

      var data = dataview.getTotalsData();

      expect(data).toBe(null);
    });

    it('should return parsed total data if there is internal model with totals', function () {
      dataview._internalModel = createHistogramInternalModelMock();

      var data = dataview.getTotalsData();

      expect(data).toEqual({ result: [ { freq: 23, normalized: 0.5 }, { freq: 46, normalized: 1 }, { normalized: 0 } ], nulls: 12, totalAmount: 707 });
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

      expect(test).toThrowError(TypeError, 'Bins must be a positive value.');
    });

    it('should set floored bins if called', function () {
      dataview.setBins(15.7);

      // We assert .getBins() as well
      expect(dataview.getBins()).toBe(15);
    });

    it('should set floored bins to internal model as well', function () {
      dataview._internalModel = createHistogramInternalModelMock();

      dataview.setBins(16);

      expect(dataview._internalModel.set).toHaveBeenCalledWith('bins', 16);

      // Clean
      dataview._internalModel = null;
    });
  });

  describe('.$setEngine', function () {
    var engine;
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Histogram(source, 'population');
      engine = createEngineMock();
    });

    it('creates the internal model', function () {
      dataview.disable(); // To test that it passes the ._enabled property to the internal model
      dataview.setBins(15);
      dataview.$setEngine(engine);

      var internalModel = dataview.$getInternalModel();
      expect(internalModel.get('source')).toBe(dataview._source.$getInternalModel());
      expect(internalModel.get('column')).toEqual(dataview._column);
      expect(internalModel.get('bins')).toBe(15);
      expect(internalModel.isEnabled()).toBe(false);
      expect(internalModel._engine.name).toEqual('Engine mock');
    });

    it('pass the syncOnBBox to the internal model', function () {
      // This check should go in the previous spec but I made this one
      // to mark it as pending until we implement the Bbox filter logic.
      pending();
    });

    it('internalModel events should be properly hooked up', function () {
      var binsChangedTriggered = false;
      dataview.on('binsChanged', function () {
        binsChangedTriggered = true;
      });
      dataview.$setEngine(engine);

      dataview.setBins(dataview.getBins() + 1);

      expect(binsChangedTriggered).toBe(true);

      // Now directly in the internal model
      binsChangedTriggered = false;

      dataview.$getInternalModel().set('bins', dataview.getBins() + 1);

      expect(binsChangedTriggered).toBe(true);
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

  describe('.getTotalsDistributionType', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Histogram(source, 'population');
    });

    it('should return null if there is no internal model', function () {
      var distribution = dataview.getTotalsDistributionType();

      expect(distribution).toBe(null);
    });

    it('should call to the proper method in internal model', function () {
      var internalModel = {
        getUnfilteredData: function () {},
        getDistributionType: function () {}
      };
      spyOn(internalModel, 'getUnfilteredData').and.returnValue('token');
      spyOn(internalModel, 'getDistributionType').and.returnValue('a');
      dataview._internalModel = internalModel;

      var distribution = dataview.getTotalsDistributionType();

      expect(internalModel.getDistributionType).toHaveBeenCalledWith('token');
      expect(distribution).toEqual('a');
    });
  });
});
