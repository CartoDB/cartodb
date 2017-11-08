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

describe('api/v4/dataview/category', function () {
  var source = createSourceMock();

  describe('initialization', function () {
    it('source must be provided', function () {
      var test = function () {
        new carto.dataview.Category(); // eslint-disable-line no-new
      };

      expect(test).toThrowError(TypeError, 'Source property is required.');
    });

    it('column must be provided', function () {
      var test = function () {
        new carto.dataview.Category(source); // eslint-disable-line no-new
      };

      expect(test).toThrowError(TypeError, 'Column property is required.');
    });

    it('options set to default if not provided', function () {
      var column = 'population';

      var dataview = new carto.dataview.Category(source, column);

      expect(dataview._maxCategories).toEqual(6);
      expect(dataview._operation).toEqual(carto.operation.COUNT);
      expect(dataview._operationColumn).toEqual('population');
    });

    it('options set to the provided value', function () {
      var dataview = new carto.dataview.Category(source, 'population', {
        maxCategories: 10,
        operation: carto.operation.AVG,
        operationColumn: 'column-test'
      });

      expect(dataview._maxCategories).toEqual(10);
      expect(dataview._operation).toEqual(carto.operation.AVG);
      expect(dataview._operationColumn).toEqual('column-test');
    });

    it('throw error if no correct operation is provided', function () {
      var test = function () {
        new carto.dataview.Category(source, 'population', { // eslint-disable-line no-new
          operation: 'exponential'
        });
      };

      expect(test).toThrowError(TypeError, 'Operation for category dataview is not valid. Use carto.operation');
    });
  });

  describe('.setMaxCategories', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Category(source, 'population');
    });

    it('checks if operation is valid', function () {
      expect(function () { dataview.setMaxCategories(); }).toThrowError(TypeError, 'Max categories for category dataview is required.');
      expect(function () { dataview.setMaxCategories('12'); }).toThrowError(TypeError, 'Max categories for category dataview must be a number.');
      expect(function () { dataview.setMaxCategories(0); }).toThrowError(TypeError, 'Max categories for category dataview must be greater than 0.');
    });

    it('if maxCategories is valid, it assigns it to property, returns this and nothing else if there is no internaModel', function () {
      var returnedObject = dataview.setMaxCategories(10);

      expect(dataview.getMaxCategories()).toEqual(10);
      expect(returnedObject).toBe(dataview);
    });

    it('sets maxCategories in internal model if exists', function () {
      var internalModelMock = createInternalModelMock();
      dataview._internalModel = internalModelMock;

      dataview.setMaxCategories(1);

      var operationArgs = internalModelMock.set.calls.mostRecent().args;
      expect(operationArgs[0]).toEqual('categories');
      expect(operationArgs[1]).toEqual(1);
    });
  });

  describe('.setOperation', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Category(source, 'population');
    });

    it('checks if operation is valid', function () {
      var test = function () {
        dataview.setOperation('swordfish');
      };

      expect(test).toThrowError(TypeError, 'Operation for category dataview is not valid. Use carto.operation');
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
  });

  describe('.setOperationColumn', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Category(source, 'population');
    });

    it('checks if operation is valid', function () {
      expect(function () { dataview.setOperationColumn(); }).toThrowError(TypeError, 'Operation column for category dataview is required.');
      expect(function () { dataview.setOperationColumn(12); }).toThrowError(TypeError, 'Operation column for category dataview must be a string.');
      expect(function () { dataview.setOperationColumn(''); }).toThrowError(TypeError, 'Operation column for category dataview must be not empty.');
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
        result: [
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
        ],
        type: 'category'
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
      engine = createEngineMock();
    });

    it('creates the internal model', function () {
      dataview.disable(); // To test that it passes the ._enabled property to the internal model
      dataview.$setEngine(engine);

      var internalModel = dataview.$getInternalModel();
      expect(internalModel.get('source')).toBe(dataview._source.$getInternalModel());
      expect(internalModel.get('column')).toEqual(dataview._column);
      expect(internalModel.get('categories')).toEqual(dataview._maxCategories);
      expect(internalModel.get('aggregation')).toEqual(dataview._operation);
      expect(internalModel.get('aggregation_column')).toEqual(dataview._operationColumn);
      expect(internalModel.isEnabled()).toBe(false);
      expect(internalModel._engine.name).toEqual('Engine mock');
    });

    it('pass the syncOnBBox to the internal model', function () {
      // This check should go in the previous spec but I made this one
      // to mark it as pending until we implement the Bbox filter logic.
      pending();
    });

    it('internalModel event operationChanged should be properly hooked up', function () {
      var operationChangedTriggered = false;
      dataview.on('operationChanged', function () {
        operationChangedTriggered = true;
      });
      dataview.$setEngine(engine);

      dataview.setOperation(carto.operation.MAX);

      expect(operationChangedTriggered).toBe(true);

      // Now directly in the internal model
      operationChangedTriggered = false;

      dataview.$getInternalModel().set('aggregation', carto.operation.COUNT);

      expect(operationChangedTriggered).toBe(true);
    });

    it('internalModel event operationColumnChanged should be properly hooked up', function () {
      var operationColumnChangedTriggered = false;
      dataview.on('operationColumnChanged', function () {
        operationColumnChangedTriggered = true;
      });
      dataview.$setEngine(engine);

      dataview.setOperationColumn('columnA');

      expect(operationColumnChangedTriggered).toBe(true);

      // Now directly in the internal model
      operationColumnChangedTriggered = false;

      dataview.$getInternalModel().set('aggregation_column', 'columnB');

      expect(operationColumnChangedTriggered).toBe(true);
    });

    it('calling twice to $setEngine does not create another internalModel', function () {
      spyOn(dataview, '_createInternalModel').and.callThrough();

      dataview.$setEngine(engine);
      dataview.$setEngine(engine);

      expect(dataview._createInternalModel.calls.count()).toBe(1);
    });
  });
});
