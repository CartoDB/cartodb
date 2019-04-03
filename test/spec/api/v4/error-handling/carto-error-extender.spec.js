var getExtraFields = require('../../../../../src/api/v4/error-handling/carto-error-extender').getExtraFields;

describe('api/v4/error-handling/carto-error-extender', function () {
  it('extending an error with no entry in the error list should return default values', function () {
    var extendedError = getExtraFields({});

    expect(extendedError.friendlyMessage).toEqual('');
    expect(extendedError.errorCode).toEqual('unknown-error');
  });

  it('extending an error with an entry in the error list that needs a regex replacement should return proper code and friendly message', function () {
    var error = {
      origin: 'windshaft',
      type: 'analysis',
      message: 'relation "invalid_value" does not exist'
    };

    var extendedError = getExtraFields(error);

    expect(extendedError.friendlyMessage).toEqual('Invalid dataset name used. Dataset "invalid_value" does not exist.');
    expect(extendedError.errorCode).toEqual('windshaft:analysis:invalid-dataset');
  });

  it('extending an error with an entry that needs two regex replacements ($0 and $1) should return proper code and friendly message', function () {
    var error = {
      origin: 'validation',
      type: 'layer',
      message: 'wrongInteractivityColumns[column1, column2]#featureClick'
    };

    var extendedError = getExtraFields(error);

    expect(extendedError.friendlyMessage).toEqual('Columns [column1, column2] set on `featureClick` do not match the columns set in aggregation options.');
    expect(extendedError.errorCode).toEqual('validation:layer:wrong-interactivity-columns');
  });

  it('extending an error with an entry in the error list that does not have friendly message should return proper code and original message', function () {
    var error = {
      origin: 'windshaft',
      type: 'analysis',
      message: 'syntax error: thruster is not a valid SQL word'
    };

    var extendedError = getExtraFields(error);

    expect(extendedError.friendlyMessage).toEqual('syntax error: thruster is not a valid SQL word');
    expect(extendedError.errorCode).toEqual('windshaft:analysis:sql-syntax-error');
  });
});
