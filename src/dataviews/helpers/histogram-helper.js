var moment = require('moment');
var _ = require('underscore');

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

function subtractAggregation (timestamp, aggregation, units) {
  var date = moment.unix(timestamp).utc();
  return date.subtract(units, MOMENT_AGGREGATIONS[aggregation]).unix();
}

function isLessThanDays (aggregation) {
  return aggregation === 'second' || aggregation === 'minute' || aggregation === 'hour';
}

function formatUTCTimestamp (timestamp) {
  return moment.unix(timestamp).utc().format('DD-MM-YYYY HH:mm:ss');
}

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

helper.fillTimestampBuckets = function (buckets, start, aggregation, numberOfBins, offset, from, totalBuckets) {
  var startOffset = isLessThanDays(aggregation) ? offset : 0;
  var startDate = moment.unix(start + startOffset).utc();
  var UTCStartDate = moment.unix(start).utc();
  var filledBuckets = []; // To catch empty buckets

  for (var i = 0; i < numberOfBins; i++) {
    filledBuckets.push(buckets[i] !== void 0);

    buckets[i] = _.extend({
      bin: i,
      start: startDate.clone().add(i, MOMENT_AGGREGATIONS[aggregation]).unix(),
      end: startDate.clone().add(i + 1, MOMENT_AGGREGATIONS[aggregation]).unix() - 1,
      next: startDate.clone().add(i + 1, MOMENT_AGGREGATIONS[aggregation]).unix(),
      UTCStart: UTCStartDate.clone().add(i, MOMENT_AGGREGATIONS[aggregation]).unix(),
      UTCEnd: UTCStartDate.clone().add(i + 1, MOMENT_AGGREGATIONS[aggregation]).unix() - 1,
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

helper.calculateLimits = function (bins) {
  var start = Infinity;
  var end = -Infinity;

  _.each(bins, function (bin) {
    if (_.isFinite(bin.min)) {
      start = Math.min(bin.min, start);
    }
    if (_.isFinite(bin.max)) {
      end = Math.max(bin.max, end);
    }
  });

  return {
    start: start !== Infinity ? start : null,
    end: end !== Infinity ? end : null
  };
};

helper.calculateDateRanges = function (aggregation, min, max) {
  var startDate = moment.unix(min).utc();
  var endDate = moment.unix(max).utc();
  var ranges = {};

  _.each(_.keys(MOMENT_AGGREGATIONS), function (agg) {
    var startClone = startDate.clone();
    var endClone = endDate.clone();
    var start = startClone.startOf(agg).unix();
    var end = endClone.startOf(agg).add(1, MOMENT_AGGREGATIONS[agg]).unix() - 1;

    ranges[agg] = {
      start: start,
      end: end
    };
  });

  return ranges;
};

helper.formatUTCTimestamp = function (timestamp) {
  return formatUTCTimestamp(timestamp);
};

module.exports = helper;
