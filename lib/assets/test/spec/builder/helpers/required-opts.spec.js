var checkAndBuildOpts = require('builder/helpers/required-opts');

describe('required opts', function () {
  describe('basic usage', function () {
    it('should throw if any required opt is missing', function () {
      var REQUIRED_OPTS = [
        'opt1',
        'opt2'
      ];

      expect(function () {
        checkAndBuildOpts({ opt1: 'foo' }, REQUIRED_OPTS, {});
      }).toThrow();
    });

    it('should set all required opts as _opt by default', function () {
      var REQUIRED_OPTS = [
        'opt1',
        'opt2'
      ];
      var ops = { opt1: 0, opt2: 1 };
      var context = {};

      checkAndBuildOpts(ops, REQUIRED_OPTS, context);
      expect(context).toEqual({ _opt1: 0, _opt2: 1 });
    });
  });
});
