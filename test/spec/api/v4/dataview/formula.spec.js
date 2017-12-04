var Backbone = require('backbone');
var _ = require('underscore');
var carto = require('../../../../../src/api/v4/index');

function createInternalModelMock () {
  var internalModelMock = {
    set: function () {},
    get: function () {}
  };
  spyOn(internalModelMock, 'set');
  spyOn(internalModelMock, 'get').and.callFake(function (key) {
    if (key === 'data') {
      return 1234;
    }
    if (key === 'nulls') {
      return 42;
    }
  });
  _.extend(internalModelMock, Backbone.Events);

  return internalModelMock;
}

function createSourceMock () {
  return new carto.source.Dataset('foo');
}

function createEngineMock () {
  var engine = {
    name: 'Engine mock',
    reload: function () {}
  };
  spyOn(engine, 'reload');

  return engine;
}

describe('api/v4/dataview/formula', function () {
  var source = createSourceMock();

  describe('initialization', function () {
    it('source must be provided', function () {
      var test = function () {
        new carto.dataview.Formula(); // eslint-disable-line no-new
      };

      expect(test).toThrowError(Error, 'Source property is required.');
    });

    it('column must be provided', function () {
      var test = function () {
        new carto.dataview.Formula(source); // eslint-disable-line no-new
      };

      expect(test).toThrowError('Column property is required.');
    });

    it('options set to default if not provided', function () {
      var column = 'population';

      var dataview = new carto.dataview.Formula(source, column);

      expect(dataview._operation).toEqual(carto.operation.COUNT);
    });

    it('options set to the provided value', function () {
      var dataview = new carto.dataview.Formula(source, 'population', {
        operation: carto.operation.AVG
      });

      expect(dataview._operation).toEqual(carto.operation.AVG);
    });

    it('throw error if no correct operation is provided', function () {
      var test = function () {
        new carto.dataview.Formula(source, 'population', { // eslint-disable-line no-new
          operation: 'exponential'
        });
      };

      expect(test).toThrowError(Error, 'Operation for formula dataview is not valid. Use carto.operation');
    });
  });

  describe('.setOperation', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Formula(source, 'population');
    });

    it('checks if operation is valid', function () {
      var test = function () {
        dataview.setOperation('swordfish');
      };

      expect(test).toThrowError(Error, 'Operation for formula dataview is not valid. Use carto.operation');
    });

    it('if operation is valid, it assigns it to property, returns this and nothing else if there is no internaModel', function () {
      var returnedObject = dataview.setOperation(carto.operation.AVG);

      expect(dataview.getOperation()).toEqual(carto.operation.AVG);
      expect(returnedObject).toBe(dataview);
    });

    it('sets operation in internal model if exists', function () {
      var internalModelMock = createInternalModelMock();
      dataview._internalModel = internalModelMock;

      dataview.setOperation(carto.operation.AVG);

      var operationArgs = internalModelMock.set.calls.mostRecent().args;
      expect(operationArgs[0]).toEqual('operation');
      expect(operationArgs[1]).toEqual(carto.operation.AVG);
    });

    it('should Trigger a operationChanged event when the operation is changed', function () {
      var operationChangedSpy = jasmine.createSpy('operationaChangedSpy');
      dataview.on('operationChanged', operationChangedSpy);

      expect(operationChangedSpy).not.toHaveBeenCalled();
      dataview.$setEngine(createEngineMock());
      dataview.setOperation(carto.operation.MAX);

      expect(operationChangedSpy).toHaveBeenCalledWith(carto.operation.MAX);
    });
  });

  describe('.getData', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Formula(source, 'population', {
        operation: carto.operation.SUM
      });
    });

    it('returns null if there is no internalModel', function () {
      var data = dataview.getData();

      expect(data).toBeNull();
    });

    it('returns data from internalModel', function () {
      var internalModelMock = createInternalModelMock();
      dataview._internalModel = internalModelMock;

      var data = dataview.getData();

      expect(data).toEqual({
        nulls: 42,
        operation: carto.operation.SUM,
        result: 1234
      });
    });
  });

  describe('.$setEngine', function () {
    var engine;
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Formula(source, 'population', {
        operation: carto.operation.MIN
      });
      engine = createEngineMock();
    });

    it('creates the internal model', function () {
      var filter = new carto.filter.BoundingBox();
      dataview.disable(); // To test that it passes the ._enabled property to the internal model
      dataview.addFilter(filter);
      dataview.$setEngine(engine);

      var internalModel = dataview.$getInternalModel();
      expect(internalModel.get('source')).toBe(dataview._source.$getInternalModel());
      expect(internalModel.get('column')).toEqual(dataview._column);
      expect(internalModel.get('operation')).toEqual(dataview._operation);
      expect(internalModel.isEnabled()).toBe(false);
      expect(internalModel._bboxFilter).toBeDefined();
      expect(internalModel.syncsOnBoundingBoxChanges()).toBe(true);
      expect(internalModel._engine.name).toEqual('Engine mock');
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
