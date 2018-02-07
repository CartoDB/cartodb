var Aggregation = require('../../../../../src/api/v4/layer/aggregation');

describe('layer-aggregation', function () {
  var options;
  beforeEach(function () {
    options = {
      threshold: 10000,
      resolution: 1,
      placement: 'point-sample',
      columns: {
        fake_name_0: {
          aggregateFunction: 'sum',
          aggregatedColumn: 'fake_column_0'
        },
        fake_name_1: {
          aggregateFunction: 'avg',
          aggregatedColumn: 'fake_column_1'
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
      expect(aggregation.columns.fake_name_0).toEqual({
        aggregate_function: 'sum',
        aggregated_column: 'fake_column_0'
      });
      expect(aggregation.columns.fake_name_1).toEqual({
        aggregate_function: 'avg',
        aggregated_column: 'fake_column_1'
      });
    });

    describe('errors', function () {
      describe('threshold', function () {
        it('should throw an error when threshold is not defined', function () {
          delete options.threshold;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError('Aggregation threshold is required.');
        });

        it('should throw an error when threshold is not a positive integer', function () {
          options.threshold = 0;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError('Aggregation threshold must be an integer value greater than 0.');

          options.threshold = -1;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError('Aggregation threshold must be an integer value greater than 0.');

          options.threshold = 2.5;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError('Aggregation threshold must be an integer value greater than 0.');
        });
      });

      describe('resolution', function () {
        it('should throw an error when resolution is not defined', function () {
          options.resolution = undefined;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError('Aggregation resolution is required.');
        });

        it('should throw an error when resolution is not an integer between 1 and 16', function () {
          var expectedErrorMessage = 'Aggregation resolution must be 0.5, 1 or powers of 2 up to 256 (2, 4, 8, 16, 32, 64, 128, 256).';
          options.resolution = 0;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError(expectedErrorMessage);

          options.resolution = 17;
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError(expectedErrorMessage);

          var validOnes = [0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256];
          validOnes.forEach(function (resolution) {
            expect(function () {
              options.resolution = resolution;
              new Aggregation(options); // eslint-disable-line
            }).not.toThrowError();
          });
        });
      });

      describe('placement', function () {
        it('should throw an error when placement is not one of our three valid placements', function () {
          options.placement = 'invalid_placement';
          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError('Aggregation placement is not valid. Must be one of these values: `point-sample`, `point-grid`, `centroid`');
        });
      });

      describe('columns', function () {
        it('should thrown an error when column.aggregateFunction is not defined', function () {
          options.columns = {
            fake_name_0: {
              aggregatedColumn: 'fake_column_0'
            }
          };

          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError("Aggregation function for column 'fake_name_0' is required.");
        });

        it('should thrown an error when column.aggregateFunction is not a valid function', function () {
          options.columns = {
            fake_name_0: {
              aggregatedColumn: 'fake_column_0',
              aggregateFunction: 'invalid_function'
            }
          };

          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError("Aggregation function for column 'fake_name_0' is not valid. Use carto.aggregation.function");
        });

        it('should thrown an error when column.aggregatedColumn is not defined', function () {
          options.columns = {
            fake_name_0: {
              aggregateFunction: 'sum'
            }
          };

          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError("Column to be aggregated to 'fake_name_0' is required.");
        });

        it('should thrown an error when column.aggregatedColumn is not a string', function () {
          options.columns = {
            fake_name_0: {
              aggregatedColumn: 4500,
              aggregateFunction: 'sum'
            }
          };

          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).toThrowError("Column to be aggregated to 'fake_name_0' must be a string.");
        });
      });

      describe('optional placement and columns', function () {
        it('should now throw an error when neither placement nor columns appear', function () {
          delete options.columns;
          delete options.placement;

          expect(function () {
            new Aggregation(options); // eslint-disable-line
          }).not.toThrow();
        });
      });
    });
  });
});
