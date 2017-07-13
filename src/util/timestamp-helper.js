var moment = require('moment');
var _ = require('underscore');
var helper = {};

helper.substractOneUnit = function (timestamp, aggregation) {
  if (!_.isNumber(timestamp)) {
    return timestamp;
  }

  var result = moment.unix(timestamp).utc();
  aggregation && aggregation === 'week'
    ? result.subtract(1, 'day')
    : result.subtract(1, aggregation);

  return result.unix();
};

module.exports = helper;
