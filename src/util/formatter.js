var _ = require('underscore');
var d3 = require('d3');

var format = {};

var formatExponential = function (value) {
  var template = _.template('<%= mantissa %><span class="Legend-exponential">x</span>10<sup class="Legend-exponential"><%= decimals %></sup>');
  var exp = value.toExponential(10);
  var parts = exp.split('e');
  return template({
    mantissa: (parts[0] * 1).toFixed(1),
    decimals: parts[1] || 0
  });
};

format.formatNumber = function (value, unit) {
  // we are using here the unary operator because parseInt fails to handle exponential number
  var converted = +value;
  if (isNaN(converted) || converted === 0) {
    return value;
  }

  value = converted;

  var format = d3.format('.2s');

  var p = 0;
  var abs_v = Math.abs(value);

  if (value > 1000) {
    value = format(value) + (unit ? ' ' + unit : '');
    return value;
  }

  if (abs_v < 0.01) {
    value = formatExponential(value) + (unit ? ' ' + unit : '');
    return value;
  }

  if (abs_v > 100) {
    p = 0;
  } else if (abs_v > 10) {
    p = 1;
  } else if (abs_v > 0.01) {
    p = Math.min(Math.ceil(Math.abs(Math.log(abs_v) / Math.log(10))) + 2, 2);
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
