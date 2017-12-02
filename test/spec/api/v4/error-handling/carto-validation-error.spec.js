var CartoValidationError = require('../../../../../src/api/v4/error-handling/carto-validation-error');

describe('v4/error-handling/carto-validation-error', function () {
  it('should return a CartoError with validation as type', function () {
    var validationError = new CartoValidationError('layer', 'a message');

    expect(validationError.name).toEqual('CartoError');
    expect(validationError.origin).toEqual('validation');
    expect(validationError.type).toEqual('layer');
    expect(validationError.message).toEqual('a message');
  });
});
