var _ = require('underscore');
var d3 = require('d3');

var format = {};

format.formatNumber = function (value, unit) {
  if (!_.isNumber(value)) {
    return value;
  }

  var format = d3.format('.2s');

  if (value < 1000) {
    var v = (value).toFixed(2);
    // v ends with .00
    if (v.match('.00' + '$')) {
      v = v.replace('.00', '');
    }
    return v;
  }

  value = format(value) + (unit ? ' ' + unit : '');

  // value ends with .0
  if (value.match('.0' + '$')) {
    value = value.replace('.0', '');
  }

  return value === '0.0' ? 0 : value;
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
