var _ = require('underscore');

function Aggregation (opts) {
  if (!opts.threshold) {
    throw new Error('Aggregation must have a threshold.');
  }

  if (!_.isFinite(opts.threshold) || opts.threshold < 1 || Math.floor(opts.threshold) !== opts.threshold) {
    throw new Error('Aggregation.threshold must have be a positive integer.');
  }

  return {
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
}

module.exports = Aggregation;
