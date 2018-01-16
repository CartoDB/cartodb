var Aggregation = require('../../../../../src/api/v4/layer/aggregation');

fdescribe('layer-aggregation', function () {
  var options;
  beforeEach(function () {
    options = {
      threshold: 10000,
      resolution: 1,
      placement: 'point-sample',
      columns: {
        fake_name_0: {
          operation: 'sum',
          column: 'fake_column_0'
        },
        fake_name_1: {
          operation: 'avg',
          column: 'fake_column_1'
        }
      }
    };
  });
  describe('constructor', function () {
    it('should return a simple object when the parameters are valid', function () {
      var aggregation = new Aggregation(options);

      expect(aggregation).toEqual({
        threshold: 10000,
        resolution: 1,
        placement: 'point-sample',
        columns: {
          fake_name_0: {
            operation: 'sum',
            column: 'fake_column_0'
          },
          fake_name_1: {
            operation: 'avg',
            column: 'fake_column_1'
          }
        }
      });
    });

    describe('errors', function () {
      describe('threshold', function () {
        it('should throw an error when threshold is not defined', function () {
          delete options.threshold;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError(Error, 'Aggregation must have a threshold.');
        });

        it('should throw an error when threshold is not a positive integer', function () {
          options.threshold = 0;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError(Error, 'Aggregation.threshold must be a positive integer.');

          options.threshold = -1;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError(Error, 'Aggregation.threshold must be a positive integer.');

          options.threshold = 2.5;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError(Error, 'Aggregation.threshold must be a positive integer.');
        });
      });

      describe('resolution', function () {
        it('should throw an error when resolution is not defined', function () { });
        it('should throw an error when resolution is not an integer between 1 and 16', function () { });
      });

      describe('placement', function () {
        it('should throw an error when is not one of our three valid placements', function () { });
      });

      describe('columns', function () {
        it('should thrown an error when column.operation is not defined', function () { });
        it('should thrown an error when column.operation is not a valid operation', function () { });
      });
    });
  });
});
