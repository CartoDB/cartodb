var moment = require('moment');
var _ = require('underscore');

var MOMENT_AGGREGATIONS = {
  day: 'd',
  hour: 'h',
  minute: 'm',
  month: 'M',
  quarter: 'Q',
  second: 's',
  week: 'w',
  year: 'y'
};

var helper = {};

helper.fillTimestampBuckets = function (buckets, start, aggregation, numberOfBins, offset) {
  var startDate = moment.unix(start).utc();

  for (var i = 0; i < numberOfBins; i++) {
    buckets[i] = _.extend({
      offset: offset,
      bin: i,
      start: startDate.clone().add(i, MOMENT_AGGREGATIONS[aggregation]).unix(),
      end: startDate.clone().add(i + 1, MOMENT_AGGREGATIONS[aggregation]).unix() - 1,
      next: startDate.clone().add(i + 1, MOMENT_AGGREGATIONS[aggregation]).unix(),
      freq: 0
    }, buckets[i]);
  }
};

helper.fillNumericBuckets = function (buckets, start, width, numberOfBins) {
  for (var i = 0; i < numberOfBins; i++) {
    buckets[i] = _.extend({
      bin: i,
      start: start + (i * width),
      end: start + ((i + 1) * width),
      freq: 0
    }, buckets[i]);
  }
};

function subtractAggregation (timestamp, aggregation, units) {
  var date = moment.unix(timestamp).utc();
  return date.subtract(units, MOMENT_AGGREGATIONS[aggregation]).unix();
}

helper.calculateStart = function (buckets, start, aggregation) {
  if (buckets.length === 0) {
    return start;
  }

  var firstBucket = buckets[0];
  return subtractAggregation(start, aggregation, firstBucket.bin);
};

helper.hasChangedSomeOf = function (list, changed) {
  return _.some(_.keys(changed), function (key) {
    return _.contains(list, key);
  });
};

module.exports = helper;
