var bytesToSize = require('new_common/view_helpers/bytes_to_size');

describe('new_common/view_helpers/bytes_to_size', function() {
  describe('.size', function() {
    [
      { bytes: 0, range: 'bytes', expectedSize: 0 },
      { bytes: 1, range: 'bytes', expectedSize: 1 },
      { bytes: 1024, range: 'kilobytes', expectedSize: 1 },
      { bytes: Math.pow(1024, 2), range: 'megabytes', expectedSize: 1 },
      { bytes: Math.pow(1024, 3), range: 'gigabytes', expectedSize: 1 },
      { bytes: Math.pow(1024, 4), range: 'terabytes', expectedSize: 1 }
    ].forEach(function(scenario) {
        describe('given a value in ' + scenario.range + ' range', function() {
          it('should return appropriate size within the calculated unit', function() {
            expect(bytesToSize(scenario.bytes).size()).toEqual(scenario.expectedSize);
          });
        });
      });
  });

  describe('.suffix', function() {
    [
      { bytes: 0, range: 'bytes', expectedSuffix: 'B' },
      { bytes: 1, range: 'bytes', expectedSuffix: 'B' },
      { bytes: 1024, range: 'kilobytes', expectedSuffix: 'kB' },
      { bytes: Math.pow(1024, 2), range: 'megabytes', expectedSuffix: 'MB' },
      { bytes: Math.pow(1024, 3), range: 'gigabytes', expectedSuffix: 'GB' },
      { bytes: Math.pow(1024, 4), range: 'terabytes', expectedSuffix: 'TB' }
    ].forEach(function(scenario) {
      describe('given a value in ' + scenario.range + ' range', function() {
        it('should return appropriate suffix', function() {
          expect(bytesToSize(scenario.bytes).suffix()).toEqual(scenario.expectedSuffix);
        });
      });
    });
  });

  describe('.toString', function() {
    it('should return a string of the size rounded up to closest decimal, suffixed by appropriate unit', function() {
      expect(bytesToSize(0).toString()).toEqual('0B');
      expect(bytesToSize(311296).toString()).toEqual('304kB');
      expect(bytesToSize(1048576000000).toString()).toEqual('977GB');
    });
  });
});
