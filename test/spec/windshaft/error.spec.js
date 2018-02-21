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

  describe('analysis error', function () {
    it('should fill context property is present', function () {
      var inputError = {
        type: 'analysis',
        analysis: {
          context: 'analysis context'
        }
      };

      var windshaftError = new WindshaftError(inputError);

      expect(windshaftError.context).toEqual('analysis context');
    });

    it('should fill analysisId with analysis node_id or id', function () {
      var inputError = {
        type: 'analysis',
        analysis: {
          node_id: 'F1'
        }
      };

      var windshaftError = new WindshaftError(inputError);

      expect(windshaftError.analysisId).toEqual('F1');

      delete inputError.analysis.node_id;
      inputError.analysis.id = 'G1';

      windshaftError = new WindshaftError(inputError);

      expect(windshaftError.analysisId).toEqual('G1');
    });
  });
});
