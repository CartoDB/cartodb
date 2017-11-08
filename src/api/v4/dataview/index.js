var Category = require('./category');
var Formula = require('./formula');
var Histogram = require('./histogram');
var status = require('../constants').status;

/**
 * @namespace carto.dataview
 * @api
 */
module.exports = {
  Category: Category,
  Formula: Formula,
  Histogram: Histogram,
  status: status
};
