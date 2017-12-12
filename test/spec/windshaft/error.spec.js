var WindshaftError = require('../../../src/windshaft/error');

describe('windshaft/error', function () {
  it('should parse properly the input error and return it', function () {
    var inputError = {
      type: 'tile',
      subtype: 'torque',
      message: 'an error happened',
      context: 'the context'
    };

    var windshaftError = new WindshaftError(inputError);

    expect(windshaftError.origin).toEqual('windshaft');
    expect(windshaftError.type).toEqual('tile');
    expect(windshaftError.subtype).toEqual('torque');
    expect(windshaftError.message).toEqual('an error happened');
    expect(windshaftError.context).toEqual('the context');
  });
});
