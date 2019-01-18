var CartoError = require('../../../../../src/api/v4/error-handling/carto-error');

describe('v4/error-handling/carto-error', function () {
  it('should return default values if the error is not qualified', function () {
    var cartoError = new CartoError({
      someProperty: 'some value'
    });

    expect(cartoError instanceof Error).toBe(true);
    expect(cartoError.name).toEqual('CartoError');
    expect(cartoError.message).toEqual('unexpected error');
    expect(cartoError.origin).toEqual('generic');
    expect(cartoError.type).toEqual('');
    expect(cartoError.errorCode).toEqual('generic:unknown-error');
    expect(cartoError.originalError).toEqual(jasmine.objectContaining({
      someProperty: 'some value'
    }));
  });

  describe('windshaft error', function () {
    it('should return the original values and proper friendly message if it is a windshaft error', function () {
      var cartoError = new CartoError({
        origin: 'windshaft',
        type: 'layer',
        message: 'column "jonica" does not exist'
      });

      expect(cartoError instanceof Error).toBe(true);
      expect(cartoError.name).toEqual('CartoError');
      expect(cartoError.message).toEqual('Invalid column name. Column "jonica" does not exist.');
      expect(cartoError.origin).toEqual('windshaft');
      expect(cartoError.type).toEqual('layer');
      expect(cartoError.errorCode).toEqual('windshaft:layer:column-does-not-exist');
      expect(cartoError.originalError).toEqual(jasmine.objectContaining({
        origin: 'windshaft',
        type: 'layer',
        message: 'column "jonica" does not exist'
      }));
    });

    it('should return the source id if it is a windshaft analysis error and analysis is provided', function () {
      var cartoError = new CartoError({
        origin: 'windshaft',
        type: 'analysis',
        message: 'column "jonica" does not exist'
      }, {
        analysis: {
          aKey: 'a value',
          getId: function () { return 'S1'; }
        }
      });

      expect(cartoError instanceof Error).toBe(true);
      expect(cartoError.source).toBeDefined();
      expect(cartoError.source.aKey).toEqual('a value');
      expect(cartoError.sourceId).toEqual('S1');
    });

    it('should return the source id if the windshaft analysis error has that value', function () {
      var cartoError = new CartoError({
        origin: 'windshaft',
        type: 'analysis',
        message: 'column "jonica" does not exist',
        analysisId: 'A1'
      });

      expect(cartoError instanceof Error).toBe(true);
      expect(cartoError.sourceId).toEqual('A1');
    });
  });

  it('should parse ajax error if original error is an ajax response', function () {
    var cartoError = new CartoError({
      responseText: '{ "errors": ["an error"] }',
      statusText: '404'
    });

    expect(cartoError instanceof Error).toBe(true);
    expect(cartoError.name).toEqual('CartoError');
    expect(cartoError.message).toEqual('an error');
    expect(cartoError.origin).toEqual('ajax');
    expect(cartoError.type).toEqual('404');
    expect(cartoError.errorCode).toEqual('ajax:404:unknown-error');
    expect(cartoError.originalError).toEqual(jasmine.objectContaining({
      responseText: '{ "errors": ["an error"] }',
      statusText: '404'
    }));
  });

  /**
   * There's a bug in PhantomJS that don't fill the stack property
   * of an error. We need to assert that the `stack` property gets
   * defined so we restrict the spec to run in the browser.
   */
  it('should create an error with a stack trace', function () {
    var cartoError = new CartoError({
      someProperty: 'some value'
    });
    var userAgent = navigator.userAgent;

    if (userAgent.toLowerCase().indexOf('phantomjs') < 0) {
      expect(cartoError.stack).toBeDefined();
    } else {
      expect(true).toBe(true);
    }
  });
});
