var _ = require('underscore');
var d3 = require('d3');

var format = {};

format.formatNumber = function (value, unit) {
  if (!_.isNumber(value) || value === 0) {
    return value;
  }

  var format = d3.format('.2s');
  var p = 0;
  var abs_v = Math.abs(value);

  if (value > 1000) {
    value = format(value) + (unit ? ' ' + unit : '');
    return value;
  }

  if (abs_v > 100) {
    p = 0;
  } else if (abs_v > 10) {
    p = 1;
  } else if (abs_v > 1) {
    p = 2;
  } else if (abs_v > 0) {
    p = Math.max(Math.ceil(Math.abs(Math.log(abs_v) / Math.log(10))) + 2, 3);
  }

  value = value.toFixed(p);
  var m = value.match(/(\.0+)$/);
  if (m) {
    value = value.replace(m[0], '');
  }

  return value;
};

format.formatDate = function (value) {
  return d3.time.format('%Y-%m-%d')(value);
};

format.formatTime = function (value) {
  return d3.time.format('%H:%M:%S %d/%m/%Y')(value);
};

format.timeFactory = function (format) {
  return d3.time.format(format);
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
