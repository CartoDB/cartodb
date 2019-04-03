var _ = require('underscore');

var AGGREGATION_DATA = {
  second: { unit: 'second', factor: 1 },
  minute: { unit: 'minute', factor: 1 },
  hour: { unit: 'hour', factor: 1 },
  day: { unit: 'day', factor: 1 },
  week: { unit: 'day', factor: 7 },
  month: { unit: 'month', factor: 1 },
  quarter: { unit: 'month', factor: 3 },
  year: { unit: 'month', factor: 12 },
  decade: { unit: 'month', factor: 120 },
  century: { unit: 'month', factor: 1200 },
  millennium: { unit: 'month', factor: 12000 }
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
  var filledBuckets = []; // To catch empty buckets
  var definedBucket = false;

  for (var i = 0; i < numberOfBins; i++) {
    definedBucket = buckets[i] !== undefined;
    filledBuckets.push(definedBucket);

    var bucketStart = this.add(start, i, aggregation);
    var nextBucketStart = this.add(start, i + 1, aggregation);

    buckets[i] = _.extend({
      bin: i,
      start: bucketStart,
      end: nextBucketStart - 1,
      next: nextBucketStart,
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
    var bucketStart = start + (i * width);
    var commonBucketEnd = start + ((i + 1) * width);
    var isLastBucket = (i + 1) === numberOfBins;
    var bucketEnd = (isLastBucket && buckets[i]) ? buckets[i].max : commonBucketEnd;
    var filledBucket = _.extend({}, {
      bin: i,
      start: bucketStart,
      end: bucketEnd,
      freq: 0
    }, buckets[i]);
    buckets[i] = filledBucket;
  }
};

helper.hasChangedSomeOf = function (list, changed) {
  return _.some(_.keys(changed), function (key) {
    return _.contains(list, key);
  });
};

/**
 * Add a `number` of aggregations to the provided timestamp
 *
 * @param {number} timestamp - Starting timestamp
 * @param {number} number - Number of aggregations to add
 * @param {object} aggregation
 * @param {string} aggregation.unit - unit of the aggregation
 * @param {number} aggregation.factor - number of aggretagion units
 */
helper.add = function (timestamp, number, aggregation) {
  if (!AGGREGATION_DATA.hasOwnProperty(aggregation)) {
    throw Error('aggregation "' + aggregation + '" is not defined');
  }
  var date = new Date(timestamp * 1000);
  var unit = AGGREGATION_DATA[aggregation].unit;
  var factor = AGGREGATION_DATA[aggregation].factor;
  var value = number * factor;
  switch (unit) {
    case 'second':
      return date.setUTCSeconds(date.getUTCSeconds() + value) / 1000;
    case 'minute':
      return date.setUTCMinutes(date.getUTCMinutes() + value) / 1000;
    case 'hour':
      return date.setUTCHours(date.getUTCHours() + value) / 1000;
    case 'day':
      return date.setUTCDate(date.getUTCDate() + value) / 1000;
    case 'month':
      var n = date.getUTCDate();
      date.setUTCDate(1);
      date.setUTCMonth(date.getUTCMonth() + value);
      date.setUTCDate(Math.min(n, _getDaysInMonth(date.getUTCFullYear(), date.getUTCMonth())));
      return date.getTime() / 1000;
    default:
      return 0;
  }
};

/* Internal functions */

function _getDaysInMonth (year, month) {
  return [31, (_isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
}

function _isLeapYear (year) {
  return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
}

module.exports = helper;
