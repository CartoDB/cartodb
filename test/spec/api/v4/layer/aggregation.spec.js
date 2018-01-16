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
          aggregate_function: 'sum',
          aggregated_column: 'fake_column_0'
        },
        fake_name_1: {
          aggregate_function: 'avg',
          aggregated_column: 'fake_column_1'
        }
      }
    };
  });

  describe('constructor', function () {
    it('should return a simple object when the parameters are valid', function () {
      var aggregation = new Aggregation(options);

      // Multiple specs for easy debugging
      expect(aggregation.threshold).toEqual(options.threshold);
      expect(aggregation.resolution).toEqual(options.resolution);
      expect(aggregation.placement).toEqual(options.placement);
      expect(aggregation.columns).toEqual(options.columns);
    });

    describe('errors', function () {
      describe('threshold', function () {
        it('should throw an error when threshold is not defined', function () {
          delete options.threshold;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrow();
        });

        it('should throw an error when threshold is not a positive integer', function () {
          options.threshold = 0;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrow();

          options.threshold = -1;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrow();

          options.threshold = 2.5;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrow();
        });
      });

      describe('resolution', function () {
        it('should throw an error when resolution is not defined', function () {
          options.resolution = undefined;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrow();
        });

        it('should throw an error when resolution is not an integer between 1 and 16', function () {
          options.resolution = 0;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrow();

          options.resolution = 17;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrow();
        });
      });

      describe('placement', function () {
        it('should throw an error when column.placement is not one of our three valid placements', function () {
          options.placement = 'invalid_placement';
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrow();
        });
      });

      describe('columns', function () {
        it('should thrown an error when column.aggregate_function is not defined', function () {
          options.columns = {
            fake_name_0: {
              aggregated_column: 'fake_column_0'
            }
          };

          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrow();
        });

        it('should thrown an error when column.aggregate_function is not a valid operation', function () {
          options.columns = {
            fake_name_0: {
              aggregated_column: 'fake_column_0',
              aggregate_function: 'invalid_operation'
            }
          };

          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrow();
        });
      });
    });
  });
});
