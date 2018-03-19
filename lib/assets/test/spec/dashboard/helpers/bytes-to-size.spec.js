const bytesToSize = require('dashboard/helpers/bytes-to-size');

describe('dashboard/helpers/bytes-to-size', function () {
  describe('.size', function () {
    [
      { bytes: 0, range: 'bytes', expectedSize: 0 },
      { bytes: 1, range: 'bytes', expectedSize: 1 },
      { bytes: 1024, range: 'kilobytes', expectedSize: 1 },
      { bytes: Math.pow(1024, 2), range: 'megabytes', expectedSize: 1 },
      { bytes: Math.pow(1024, 3), range: 'gigabytes', expectedSize: 1 },
      { bytes: Math.pow(1024, 4), range: 'terabytes', expectedSize: 1 }
    ].forEach(function (scenario) {
      describe('given a value in ' + scenario.range + ' range', function () {
        it('should return appropriate size within the calculated unit', function () {
          expect(bytesToSize(scenario.bytes).size()).toEqual(scenario.expectedSize);
        });
      });
    });
  });

  describe('.suffix', function () {
    [
      { bytes: 0, range: 'bytes', expectedSuffix: 'B' },
      { bytes: 1, range: 'bytes', expectedSuffix: 'B' },
      { bytes: 1024, range: 'kilobytes', expectedSuffix: 'kB' },
      { bytes: Math.pow(1024, 2), range: 'megabytes', expectedSuffix: 'MB' },
      { bytes: Math.pow(1024, 3), range: 'gigabytes', expectedSuffix: 'GB' },
      { bytes: Math.pow(1024, 4), range: 'terabytes', expectedSuffix: 'TB' }
    ].forEach(function (scenario) {
      describe('given a value in ' + scenario.range + ' range', function () {
        it('should return appropriate suffix', function () {
          expect(bytesToSize(scenario.bytes).suffix()).toEqual(scenario.expectedSuffix);
        });
      });
    });
  });

  describe('.toString', function () {
    it('should return a string of the size rounded down to closest full number, suffixed by appropriate unit', function () {
      expect(bytesToSize(0).toString()).toEqual('0B');
      expect(bytesToSize(311296).toString()).toEqual('304kB');
      expect(bytesToSize(1048576000000).toString()).toEqual('976GB');
      expect(bytesToSize(10485759).toString()).toEqual('9MB');
    });

    describe('when given 1', function () {
      it('should return a string with 1 decimal rounded down', function () {
        expect(bytesToSize(10485759).toString(1)).toEqual('9.9MB');
      });
    });

    describe('when given 2', function () {
      it('should return a string with 2 decimals rounded down', function () {
        expect(bytesToSize(10485759).toString(2)).toEqual('9.99MB');
      });
    });
  });
});
