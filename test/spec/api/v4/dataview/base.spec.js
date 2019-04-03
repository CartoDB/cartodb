var DataviewBase = require('../../../../../src/api/v4/dataview/base');
var status = require('../../../../../src/api/v4/constants').status;
var carto = require('../../../../../src/api/v4/index');

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

describe('api/v4/dataview/base', function () {
  var base = new DataviewBase();

  it('.getStatus should return the internal status', function () {
    expect(base.getStatus()).toEqual(base._status);
  });

  describe('.isLoading', function () {
    it('should return true if loading and false otherwise', function () {
      base._status = status.NOT_LOADED;
      expect(base.isLoading()).toBe(false);
      base._status = status.LOADING;
      expect(base.isLoading()).toBe(true);
    });

    it('should return true if loading and false otherwise', function () {
      base._status = status.NOT_LOADED;
      expect(base.isLoaded()).toBe(false);
      base._status = status.LOADED;
      expect(base.isLoaded()).toBe(true);
    });
  });

  describe('.hasError', function () {
    it('should return true if loading and false otherwise', function () {
      base._status = status.NOT_LOADED;
      expect(base.hasError()).toBe(false);
      base._status = status.ERROR;
      expect(base.hasError()).toBe(true);
    });
  });

  describe('.enable', function () {
    it('should enable the dataview', function () {
      base.enable();
      expect(base._enabled).toBe(true);
    });

    it('should return the dataview', function () {
      expect(base.enable()).toBe(base);
    });
  });

  describe('.disable', function () {
    it('should disable the dataview', function () {
      base.disable();
      expect(base._enabled).toBe(false);
    });

    it('should return the dataview', function () {
      expect(base.disable()).toBe(base);
    });
  });

  describe('.isEnabled', function () {
    it('should return true if enabled and false otherwise', function () {
      base.disable();
      expect(base.isEnabled()).toBe(false);
      base.enable();
      expect(base.isEnabled()).toBe(true);
    });
  });

  describe('.getSource', function () {
    it('should return the source object', function () {
      var source = new carto.source.Dataset('table_name');
      base._source = source;
      expect(base.getSource()).toBe(source);
    });
  });

  describe('.setColumn', function () {
    it('should set the column name as string', function () {
      var column = 'column-test';
      base.setColumn(column);
      expect(base._column).toBe(column);
    });

    it('should throw an error if the argument is not string or undefined', function () {
      var requiredColumnError;
      var stringColumnError;
      var emptyColumnError;

      try { base.setColumn(); } catch (error) { requiredColumnError = error; }
      try { base.setColumn(12); } catch (error) { stringColumnError = error; }
      try { base.setColumn(''); } catch (error) { emptyColumnError = error; }

      expect(requiredColumnError).toEqual(jasmine.objectContaining({
        message: 'Column property is required.',
        type: 'dataview',
        errorCode: 'validation:dataview:column-required'
      }));
      expect(stringColumnError).toEqual(jasmine.objectContaining({
        message: 'Column property must be a string.',
        type: 'dataview',
        errorCode: 'validation:dataview:column-string'
      }));
      expect(emptyColumnError).toEqual(jasmine.objectContaining({
        message: 'Column property must be not empty.',
        type: 'dataview',
        errorCode: 'validation:dataview:empty-column'
      }));
    });

    it('should return the dataview', function () {
      var column = 'column-test';
      expect(base.setColumn(column)).toBe(base);
    });
  });

  describe('.getColumn', function () {
    it('should return the column name', function () {
      var column = 'column-test2';
      base._column = column;
      expect(base.getColumn()).toBe(column);
    });
  });

  describe('.getData', function () {
    it('.getData should not be defined in the base dataview', function () {
      expect(function () { base.getData(); }).toThrowError(Error, 'getData must be implemented by the particular dataview.');
    });
  });

  describe('._changeProperty', function () {
    it('should set internal property', function () {
      base._example = 'something';

      base._changeProperty('example', 'whatever');

      expect(base._example).toEqual('whatever');
    });

    it('should trigger change is there is no internal model', function () {
      var eventValue = '';
      base._example = 'something';
      base.on('exampleChanged', function (newValue) {
        eventValue = newValue;
      });

      base._changeProperty('example', 'whatever');

      expect(eventValue).toEqual('whatever');
    });

    it('should update internal model and trigger a change when the internalModel exists', function () {
      var internalModelSpy = jasmine.createSpyObj('internalModelSpy', ['set']);
      base._example = 'something';
      base._internalModel = internalModelSpy;
      spyOn(base, '_triggerChange');

      base._changeProperty('example', 'whatever');

      expect(internalModelSpy.set).toHaveBeenCalledWith('example', 'whatever');
      expect(base._triggerChange).toHaveBeenCalled();
    });
  });

  describe('.$setEngine', function () {
    var engine;
    var dataview;

    beforeEach(function () {
      // We use Formula for these tests. Any other dataview could be used instead.
      dataview = new carto.dataview.Formula(createSourceMock(), 'population', {
        operation: carto.operation.MIN
      });
      engine = createEngineMock();
    });

    it('internalModel events should be properly hooked up', function () {
      dataview.$setEngine(engine);
      var internalModel = dataview._internalModel;
      var eventStatus = null;
      var eventError = null;
      var dataviewError = null;
      dataview.on('statusChanged', function (newStatus, error) {
        eventStatus = newStatus;
        eventError = error;
      });
      dataview.on('error', function (error) {
        dataviewError = error;
      });

      // Loading
      internalModel.trigger('loading');

      expect(dataview.getStatus()).toEqual('loading');
      expect(eventStatus).toEqual('loading');

      // Loaded
      internalModel.trigger('loaded');

      expect(dataview.getStatus()).toEqual('loaded');
      expect(eventStatus).toEqual('loaded');

      // Error
      internalModel.trigger('statusError', internalModel, 'an error');

      expect(dataview.getStatus()).toEqual('error');
      expect(eventStatus).toEqual('error');
      expect(eventError).toEqual('an error');
      expect(dataviewError.name).toEqual('CartoError');
    });
  });

  describe('add bbox filter', function () {
    it('should check if it is a proper object', function () {
      function test () {
        base.addFilter('invalid_filter');
      }

      expect(test).toThrowError('Filter property is required.');
    });

    it('should throw an error if an SQL filter is passed', function () {
      function test () {
        var categoryFilter = new carto.filter.Category('fake_column', { in: ['category_value'] });
        base.addFilter(categoryFilter);
      }

      expect(test).toThrowError('Filter property is required.');
    });
  });
});
