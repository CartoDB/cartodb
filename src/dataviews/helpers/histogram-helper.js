var _ = require('underscore');
var moment = require('moment');

// Preserve the ascendant order!
var MOMENT_AGGREGATIONS = {
  second: 's',
  minute: 'm',
  hour: 'h',
  day: 'd',
  week: 'w',
  month: 'M',
  quarter: 'Q',
  year: 'y'
};

var helper = {};

function trimBuckets (buckets, filledBuckets, totalBuckets) {
  var index = null;
  var keepGoing = true;
  for (var i = filledBuckets.length - 1; i >= 0 && keepGoing && (_.isFinite(totalBuckets) ? i >= totalBuckets : true); i--) {
    if (filledBuckets[i]) {
      keepGoing = false;
    } else {
      index = i;
    }
  }

  return index !== null
    ? buckets.slice(0, index)
    : buckets;
}

helper.fillTimestampBuckets = function (buckets, start, aggregation, numberOfBins, from, totalBuckets) {
  var startDate = moment.unix(start).utc();
  var filledBuckets = []; // To catch empty buckets
  var definedBucket = false;

  for (var i = 0; i < numberOfBins; i++) {
    definedBucket = buckets[i] !== undefined;
    filledBuckets.push(definedBucket);

    buckets[i] = _.extend({
      bin: i,
      start: startDate.clone().add(i, MOMENT_AGGREGATIONS[aggregation]).unix(),
      end: startDate.clone().add(i + 1, MOMENT_AGGREGATIONS[aggregation]).unix() - 1,
      next: startDate.clone().add(i + 1, MOMENT_AGGREGATIONS[aggregation]).unix(),
      freq: 0
    }, buckets[i]);
    delete buckets[i].timestamp;
  }

  return from === 'totals'
    ? buckets
    : trimBuckets(buckets, filledBuckets, totalBuckets);
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

helper.hasChangedSomeOf = function (list, changed) {
  return _.some(_.keys(changed), function (key) {
    return _.contains(list, key);
  });
};

module.exports = helper;
