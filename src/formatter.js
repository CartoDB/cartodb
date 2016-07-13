var _ = require('underscore');
var d3 = require('d3');

var format = {};

format.formatNumber = function (value, unit) {
  if (!_.isNumber(value) || value == 0) {
    return value === '0.0' ? 0 : value:
  }

  var format = d3.format('.2s');
  var p = 0;

  if (value > 1000){
    return value = format(value) + (unit ? ' ' + unit : '');
  }

  if (Math.abs(value) > 100) { p = 0; }
  else if (Math.abs(value) > 10) { p = 1; }
  else if (Math.abs(value) > 1) { p = 2; }
  else if (Math.abs(value) > 0) { p = 3; }

  value = value.toFixed(p);
  if (m = value.match(/(\.0+)$/)) {
    value = value.replace(m[0], '');
  }

  return value;
};

format.formatDate = function (value) {
  return d3.time.format('%Y-%m-%d')(value);
};

format.formatValue = function (value) {
  if (_.isNumber(value)) {
    return format.formatNumber(value);
  }
  if (_.isDate(value)) {
    return format.formatDate(value);
  }
  return value;
};

module.exports = format;
