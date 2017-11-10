var DataviewBase = require('../../../../../src/api/v4/dataview/base');
var status = require('../../../../../src/api/v4/constants').status;

describe('api/v4/dataview/base', function () {
  var base = new DataviewBase();

  it('.getStatus should return the internal status', function () {
    expect(base.getStatus()).toEqual(base._status);
  });

  it('.isLoading should return true if loading and false otherwise', function () {
    base._status = status.NOT_LOADED;
    expect(base.isLoading()).toBe(false);
    base._status = status.LOADING;
    expect(base.isLoading()).toBe(true);
  });

  it('.isLoaded should return true if loading and false otherwise', function () {
    base._status = status.NOT_LOADED;
    expect(base.isLoaded()).toBe(false);
    base._status = status.LOADED;
    expect(base.isLoaded()).toBe(true);
  });

  it('.hasError should return true if loading and false otherwise', function () {
    base._status = status.NOT_LOADED;
    expect(base.hasError()).toBe(false);
    base._status = status.ERROR;
    expect(base.hasError()).toBe(true);
  });

  it('.enable should enable the dataview', function () {
    base.enable();
    expect(base._enabled).toBe(true);
  });

  it('.enable should return the dataview', function () {
    expect(base.enable()).toBe(base);
  });

  it('.disable should disable the dataview', function () {
    base.disable();
    expect(base._enabled).toBe(false);
  });

  it('.disable should return the dataview', function () {
    expect(base.disable()).toBe(base);
  });

  it('.isEnabled should return true if enabled and false otherwise', function () {
    base.disable();
    expect(base.isEnabled()).toBe(false);
    base.enable();
    expect(base.isEnabled()).toBe(true);
  });

  it('.setColumn should set the column name as string', function () {
    var column = 'column-test';
    base.setColumn(column);
    expect(base._column).toBe(column);
  });

  it('.setColumn should throw an error if the argument is not string or undefined', function () {
    expect(function () { base.setColumn(); }).toThrowError(TypeError, 'Column property is required.');
    expect(function () { base.setColumn(12); }).toThrowError(TypeError, 'Column property must be a string.');
    expect(function () { base.setColumn(''); }).toThrowError(TypeError, 'Column property must be not empty.');
  });

  it('.setColumn should return the dataview', function () {
    var column = 'column-test';
    expect(base.setColumn(column)).toBe(base);
  });

  it('.getColumn should return the column name', function () {
    var column = 'column-test2';
    base._column = column;
    expect(base.getColumn()).toBe(column);
  });

  it('.getData should not be defined in the base dataview', function () {
    expect(function () { base.getData(); }).toThrowError(Error, 'getData must be implemented by the particular dataview.');
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

    it('should value in internal model if exists', function () {
      var usedKey = '';
      var usedValue = '';
      var internalModel = {
        set: function (key, value) {
          usedKey = key;
          usedValue = value;
        }
      };
      base._example = 'something';
      base._internalModel = internalModel;
      spyOn(base, '_triggerChange');

      base._changeProperty('example', 'whatever');

      expect([usedKey, usedValue]).toEqual(['example', 'whatever']);
      expect(base._triggerChange).not.toHaveBeenCalled();
    });
  });
});
