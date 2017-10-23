var parseWindshaftErrors = require('../../../src/windshaft/error-parser');

describe('error-parser', function () {
  it('should return errors with context if available', function () {
    var response = {
      errors_with_context: [{
        type: 'layer',
        message: 'Your princess is in another castle',
        layer: {
          id: '6675c6a3-8c57-4033-9fba-072215565521'
        }
      }],
      errors: ['All your base are belong to us']
    };

    var parsedErrors = parseWindshaftErrors(response);

    expect(parsedErrors.length).toBe(1);
    expect(parsedErrors[0].message).toEqual('Your princess is in another castle');
    expect(parsedErrors[0].layerId).toEqual('6675c6a3-8c57-4033-9fba-072215565521');
  });

  it('should return one simple error if no ones with context are available', function () {
    var response = {
      errors: [
        'You must defeat Sheng Long to stand a chance.',
        'You did quite well, but you need more training to defeat me!'
      ]
    };

    var parsedErrors = parseWindshaftErrors(response);

    expect(parsedErrors.length).toBe(1);
    expect(parsedErrors[0].message).toEqual('You must defeat Sheng Long to stand a chance.');
  });
});
