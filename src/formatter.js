var _ = require('underscore');
var d3 = require('d3');
var moment = require('moment');
require('moment-timezone');

var AGGREGATION_FORMATS = {
  second: {
    display: 'HH:mm:ss',
    unit: 's'
  },
  minute: {
    display: 'HH:mm L',
    unit: 'm'
  },
  hour: {
    display: 'HH:mm L',
    unit: 'h'
  },
  day: {
    display: 'Do MMM YYYY',
    unit: 'd'
  },
  week: {
    display: 'Do MMM YYYY',
    unit: 'w'
  },
  month: {
    display: 'MMM YYYY',
    unit: 'M'
  },
  quarter: {
    display: '[Q]Q YYYY',
    unit: 'Q'
  },
  year: {
    display: 'YYYY',
    unit: 'y'
  }
};

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

format.timestampFactory = function (aggregation, offset, localTimezone) {
  var localOffset = localTimezone ? moment.tz(moment.tz.guess()).utcOffset() * 60 : offset || 0;
  return function (timestamp) {
    if (!_.has(AGGREGATION_FORMATS, aggregation)) {
      return '-';
    }
    var format = AGGREGATION_FORMATS[aggregation];
    var date = moment.unix(timestamp + localOffset).utc();
    var formatted = date.format(format.display);
    return formatted;
  };
};

module.exports = format;
