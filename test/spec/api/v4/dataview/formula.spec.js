var Backbone = require('backbone');
var _ = require('underscore');
var carto = require('../../../../../src/api/v4/index');

function createFakeInternalModel () {
  var internalModel = {
    set: function () {},
    get: function () {}
  };
  spyOn(internalModel, 'set');
  spyOn(internalModel, 'get').and.callFake(function (key) {
    if (key === 'data') {
      return 1234;
    }
    if (key === 'nulls') {
      return 42;
    }
  });
  _.extend(internalModel, Backbone.Events);

  return internalModel;
}

function createFakeSource () {
  return new carto.source.Dataset();
}

function createFakeEngine () {
  var engine = {
    name: 'Fake engine',
    reload: function () {}
  };
  spyOn(engine, 'reload');

  return engine;
}

describe('formula dataview public v4 API', function () {
  var source = createFakeSource();

  describe('initialization', function () {
    it('source must be provided', function () {
      var test = function () {
        new carto.dataview.Formula(); // eslint-disable-line no-new
      };

      expect(test).toThrowError(TypeError, 'Source property is required.');
    });

    it('column must be provided', function () {
      var test = function () {
        new carto.dataview.Formula(source); // eslint-disable-line no-new
      };

      expect(test).toThrowError(TypeError, 'Column property is required.');
    });

    it('options set to default if not provided', function () {
      var column = 'population';

      var dataview = new carto.dataview.Formula(source, column);

      expect(dataview._options).toBeDefined();
      expect(dataview._options.operation).toEqual(carto.OPERATION.COUNT);
    });

    it('options set to the provided value', function () {
      var dataview = new carto.dataview.Formula(source, 'population', {
        operation: carto.OPERATION.AVG
      });

      expect(dataview._options.operation).toEqual(carto.OPERATION.AVG);
    });

    it('throw error if no correct operation is provided', function () {
      var test = function () {
        new carto.dataview.Formula(source, 'population', { // eslint-disable-line no-new
          operation: 'exponential'
        });
      };

      expect(test).toThrowError(TypeError, 'Operation for formula dataview is not valid. Use carto.OPERATION');
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

      expect(test).toThrowError(TypeError, 'Operation for formula dataview is not valid. Use carto.OPERATION');
    });

    it('if operation is valid, it assigns it to property, returns this and nothing else if there is no internaModel', function () {
      var returnedObject = dataview.setOperation(carto.OPERATION.AVG);

      expect(dataview.getOperation()).toEqual(carto.OPERATION.AVG);
      expect(returnedObject).toBe(dataview);
    });

    it('sets operation in internal model if exists', function () {
      var internalModel = createFakeInternalModel();
      dataview._internalModel = internalModel;

      dataview.setOperation(carto.OPERATION.AVG);

      var operationArgs = internalModel.set.calls.mostRecent().args;
      expect(operationArgs[0]).toEqual('operation');
      expect(operationArgs[1]).toEqual(carto.OPERATION.AVG);
    });
  });

  describe('.getData', function () {
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Formula(source, 'population', {
        operation: carto.OPERATION.SUM
      });
    });

    it('returns null if there is no internalModel', function () {
      var data = dataview.getData();

      expect(data).toBeNull();
    });

    it('returns data from internalModel', function () {
      var internalModel = createFakeInternalModel();
      dataview._internalModel = internalModel;

      var data = dataview.getData();

      expect(data).toEqual({
        type: 'formula',
        operation: carto.OPERATION.SUM,
        result: 1234,
        nulls: 42
      });
    });
  });

  describe('.$setEngine', function () {
    var engine;
    var dataview;

    beforeEach(function () {
      dataview = new carto.dataview.Formula(source, 'population', {
        operation: carto.OPERATION.MIN
      });
      engine = createFakeEngine();
    });

    it('creates the internal model', function () {
      dataview.disable(); // To test that it passes the ._enabled property to the internal model
      dataview.$setEngine(engine);

      var internalModel = dataview.$getInternalModel();
      expect(internalModel.get('source')).toBe(dataview._source.$getInternalModel());
      expect(internalModel.get('column')).toEqual(dataview._column);
      expect(internalModel.get('operation')).toEqual(dataview._options.operation);
      expect(internalModel.isEnabled()).toBe(false);
      expect(internalModel._engine.name).toEqual('Fake engine');
    });

    it('pass the syncOnBBox to the internal model', function () {
      // This check should go in the previous spec but I made this one
      // to mark it as pending until we implement the Bbox filter logic.
      pending();
    });

    it('internalModel events should be properly hooked up', function () {
      var operationChangedTriggered = false;
      dataview.on('operationChanged', function () {
        operationChangedTriggered = true;
      });
      dataview.$setEngine(engine);

      dataview.setOperation(carto.OPERATION.MAX);

      expect(operationChangedTriggered).toBe(true);

      // Now directly in the internal model
      operationChangedTriggered = false;

      dataview.$getInternalModel().set('operation', carto.OPERATION.COUNT);

      expect(operationChangedTriggered).toBe(true);
    });

    it('calling twice to $setEngine does not create another internalModel', function () {
      spyOn(dataview, '_createInternalModel').and.callThrough();

      dataview.$setEngine(engine);
      dataview.$setEngine(engine);

      expect(dataview._createInternalModel.calls.count()).toBe(1);
    });
  });
});
