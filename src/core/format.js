var _ = require('underscore');
var d3 = require('d3');

var format = {};

format._formatNumber = function(value) {
  return d3.format(",")(value);
}

format._formatDate = function(value) {
  return d3.time.format("%Y-%m-%d")(value);
}

format.formatValue = function(value) {
  if (_.isNumber(value)) {
    return format._formatNumber(value);
  }
  if (_.isDate(value)) {
    return format._formatDate(value);
  }
  return value;
}

module.exports = format;
