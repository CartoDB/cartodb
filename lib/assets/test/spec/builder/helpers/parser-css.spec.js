var ParserCSS = require('builder/helpers/parser-css');

describe('helpers/parser-css', function () {
  var parser = new ParserCSS();

  describe('.parseError', function () {
    describe('when the error is a formatted string', function () {
      it('returns the error with line and message', function () {
        var given = ['style.mss:7:2 Invalid code: Kenobi'];
        var expected = [{ line: 7, message: 'Invalid code: Kenobi' }];

        expect(parser.parseError(given)).toEqual(expected);
      });
    });

    describe('when the error is not a formatted string', function () {
      it('returns the error without line and with message', function () {
        var given = ['Do not tell me the odds'];
        var expected = [{ line: null, message: 'Do not tell me the odds' }];

        expect(parser.parseError(given)).toEqual(expected);
      });
    });

    describe('when the error is an object', function () {
      it('returns the same error', function () {
        var given = [{ line: 66, message: 'Execute order' }];

        expect(parser.parseError(given)).toEqual(given);
      });
    });

    it('returns the errors sorted by line order', function () {
      var errors = parser.parseError([
        'style.mss:7:2 General Kenobi',
        'style.mss:3:2 Hello there',
        'this wont have a line number'
      ]);

      expect(errors[0].message).toEqual('this wont have a line number');
      expect(errors[1].message).toEqual('Hello there');
      expect(errors[2].message).toEqual('General Kenobi');
    });

    it('removes duplicated errors', function () {
      var error = 'style.mss:7:2 You were my brother Anakin';
      var parsed = parser.parseError([error, error]);

      expect(parsed.length).toBe(1);
    });

    describe('when the error list is empty', function () {
      it('returns an empty array', function () {
        expect(parser.parseError([])).toEqual([]);
      });
    });

    describe('when the error list is missing', function () {
      it('returns an empty array', function () {
        expect(parser.parseError()).toEqual([]);
      });
    });
  });
});
