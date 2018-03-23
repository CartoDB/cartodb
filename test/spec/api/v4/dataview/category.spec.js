var Backbone = require('backbone');
var _ = require('underscore');
var carto = require('../../../../../src/api/v4/index');
var createEngine = require('../../../fixtures/engine.fixture.js');

function createInternalModelMock () {
  var internalModelMock = {
    set: function () {},
    get: function () {}
  };
  spyOn(internalModelMock, 'set');
  spyOn(internalModelMock, 'get').and.callFake(function (key) {
    switch (key) {
      case 'count': return 42;
      case 'max': return 9;
      case 'min': return 1;
      case 'nulls': return 0;
      case 'data': return [
        {
          name: 'cat1',
          value: 1,
          agg: false
        },
        {
          name: 'others',
          value: 9,
          agg: true
        }
      ];
    }
  });
  _.extend(internalModelMock, Backbone.Events);

  return internalModelMock;
}

function createSourceMock () {
  return new carto.source.Dataset('foo');
}

describe('api/v4/dataview/category', function () {
  var source = createSourceMock();

  describe('initialization', function () {
    it('source must be provided', function () {
      var error;
      try { new carto.dataview.Category(); } catch (err) { error = err; } // eslint-disable-line no-new

      expect(error).toEqual(jasmine.objectContaining({
        message: 'Source property is required.',
        type: 'dataview',
        errorCode: 'validation:dataview:source-required'
      }));
    });

    it('column must be provided', function () {
      var error;
      try { new carto.dataview.Category(source); } catch (err) { error = err; } // eslint-disable-line no-new

      expect(error).toEqual(jasmine.objectContaining({
        message: 'Column property is required.',
        type: 'dataview',
        errorCode: 'validation:dataview:column-required'
      }));
    });

    it('options set to default if not provided', function () {
      var column = 'population';

      var dataview = new carto.dataview.Category(source, column);

      expect(dataview._limit).toEqual(6);
      expect(dataview._operation).toEqual(carto.operation.COUNT);
      expect(dataview._operationColumn).toEqual('population');
    });

    it('options set to the provided value', function () {
      var dataview = new carto.dataview.Category(source, 'population', {
        limit: 10,
        operation: carto.operation.AVG,
        operationColumn: 'column-test'
      });

      expect(dataview._limit).toEqual(10);
      expect(dataview._operation).toEqual(carto.operation.AVG);
      expect(dataview._operationColumn).toEqual('column-test');
    });

    it('throw error if no correct operation is provided', function () {
      var error;
      var test = function () {
        new carto.dataview.Category(source, 'population', { // eslint-disable-line no-new
          operation: 'exponential'
        });
      };

      try { test(); } catch (err) { error = err; }

      expect(error).toEqual(jasmine.objectContaining({
        message: 'Operation for category dataview is not valid. Use carto.operation',
        type: 'dataview',
        errorCode: 'validation:dataview:category-invalid-operation'
      }));
    });
  });

  describe('.setLimit', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Category(source, 'population');
    });

    it('checks if limit is valid', function () {
      var requiredError;
      var numberError;
      var positiveError;

      try { dataview.setLimit(); } catch (err) { requiredError = err; }
      try { dataview.setLimit('12'); } catch (err) { numberError = err; }
      try { dataview.setLimit(0); } catch (err) { positiveError = err; }

      expect(requiredError).toEqual(jasmine.objectContaining({
        message: 'Limit for category dataview is required.',
        type: 'dataview',
        errorCode: 'validation:dataview:category-limit-required'
      }));
      expect(numberError).toEqual(jasmine.objectContaining({
        message: 'Limit for category dataview must be a number.',
        type: 'dataview',
        errorCode: 'validation:dataview:category-limit-number'
      }));
      expect(positiveError).toEqual(jasmine.objectContaining({
        message: 'Limit for category dataview must be greater than 0.',
        type: 'dataview',
        errorCode: 'validation:dataview:category-limit-positive'
      }));
    });

    it('if limit is valid, it assigns it to property, returns this and nothing else if there is no internaModel', function () {
      var returnedObject = dataview.setLimit(10);

      expect(dataview.getLimit()).toEqual(10);
      expect(returnedObject).toBe(dataview);
    });

    it('sets limit in internal model if exists', function () {
      var internalModelMock = createInternalModelMock();
      dataview._internalModel = internalModelMock;

      dataview.setLimit(1);

      var operationArgs = internalModelMock.set.calls.mostRecent().args;
      expect(operationArgs[0]).toEqual('categories');
      expect(operationArgs[1]).toEqual(1);
    });

    it('should trigger a limitChanged event', function () {
      var limitChangedSpy = jasmine.createSpy('operationaChangedSpy');
      dataview.on('limitChanged', limitChangedSpy);

      expect(limitChangedSpy).not.toHaveBeenCalled();
      dataview.$setEngine(createEngine());
      dataview.setLimit(7);

      expect(limitChangedSpy).toHaveBeenCalledWith(7);
    });
  });

  describe('.setOperation', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Category(source, 'population');
    });

    it('checks if operation is valid', function () {
      var error;
      var test = function () {
        dataview.setOperation('swordfish');
      };

      try { test(); } catch (err) { error = err; }

      expect(error).toEqual(jasmine.objectContaining({
        message: 'Operation for category dataview is not valid. Use carto.operation',
        type: 'dataview',
        errorCode: 'validation:dataview:category-invalid-operation'
      }));
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
      expect(operationArgs[0]).toEqual('aggregation');
      expect(operationArgs[1]).toEqual(carto.operation.AVG);
    });

    it('should trigger a operationChanged event', function () {
      var operationChangedSpy = jasmine.createSpy('operationaChangedSpy');
      dataview.on('operationChanged', operationChangedSpy);

      expect(operationChangedSpy).not.toHaveBeenCalled();
      dataview.$setEngine(createEngine());
      dataview.setOperation(carto.operation.AVG);

      expect(operationChangedSpy).toHaveBeenCalledWith(carto.operation.AVG);
    });
  });

  describe('.setOperationColumn', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Category(source, 'population');
    });

    it('checks if operation is valid', function () {
      var requiredError;
      var numberError;
      var emptyError;

      try { dataview.setOperationColumn(); } catch (err) { requiredError = err; }
      try { dataview.setOperationColumn(12); } catch (err) { numberError = err; }
      try { dataview.setOperationColumn(''); } catch (err) { emptyError = err; }

      expect(requiredError).toEqual(jasmine.objectContaining({
        message: 'Operation column for category dataview is required.',
        type: 'dataview',
        errorCode: 'validation:dataview:category-operation-required'
      }));
      expect(numberError).toEqual(jasmine.objectContaining({
        message: 'Operation column for category dataview must be a string.',
        type: 'dataview',
        errorCode: 'validation:dataview:category-operation-string'
      }));
      expect(emptyError).toEqual(jasmine.objectContaining({
        message: 'Operation column for category dataview must be not empty.',
        type: 'dataview',
        errorCode: 'validation:dataview:category-operation-empty'
      }));
    });

    it('if operation is valid, it assigns it to property, returns this and nothing else if there is no internaModel', function () {
      var returnedObject = dataview.setOperationColumn('columnA');

      expect(dataview.getOperationColumn()).toEqual('columnA');
      expect(returnedObject).toBe(dataview);
    });

    it('sets operation in internal model if exists', function () {
      var internalModelMock = createInternalModelMock();
      dataview._internalModel = internalModelMock;

      dataview.setOperationColumn('columnB');

      var operationArgs = internalModelMock.set.calls.mostRecent().args;
      expect(operationArgs[0]).toEqual('aggregation_column');
      expect(operationArgs[1]).toEqual('columnB');
    });

    it('should trigger a operationColumnChanged event', function () {
      var operationColumnChangedSpy = jasmine.createSpy('operationaChangedSpy');
      dataview.on('operationColumnChanged', operationColumnChangedSpy);

      expect(operationColumnChangedSpy).not.toHaveBeenCalled();
      dataview.$setEngine(createEngine());
      dataview.setOperationColumn('column2');

      expect(operationColumnChangedSpy).toHaveBeenCalledWith('column2');
    });
  });

  describe('.getData', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Category(source, 'population', {
        operation: carto.operation.SUM,
        operationColumn: 'column-test'
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
        count: 42,
        max: 9,
        min: 1,
        nulls: 0,
        operation: carto.operation.SUM,
        categories: [
          {
            name: 'cat1',
            value: 1,
            group: false
          },
          {
            name: 'others',
            value: 9,
            group: true
          }
        ]
      });
    });
  });

  describe('.$setEngine', function () {
    var engine;
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Category(source, 'population', {
        operation: carto.operation.MIN,
        operationColumn: 'column-test'
      });
      engine = createEngine();
    });

    it('creates the internal model', function () {
      var filter = new carto.filter.BoundingBox();
      dataview.disable(); // To test that it passes the ._enabled property to the internal model
      dataview.addFilter(filter);
      dataview.$setEngine(engine);

      var internalModel = dataview.$getInternalModel();
      expect(internalModel.get('source')).toBe(dataview._source.$getInternalModel());
      expect(internalModel.get('column')).toEqual(dataview._column);
      expect(internalModel.get('categories')).toEqual(dataview._limit);
      expect(internalModel.get('aggregation')).toEqual(dataview._operation);
      expect(internalModel.get('aggregation_column')).toEqual(dataview._operationColumn);
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
