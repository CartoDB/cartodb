var moment = require('moment');
var _ = require('underscore');

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

helper.isShorterThan = function (limit, aggregation) {
  var keys = _.keys(MOMENT_AGGREGATIONS);
  var limitIndex = _.indexOf(keys, limit);
  var aggregationIndex = _.indexOf(keys, aggregation);
  return limitIndex > -1 && aggregationIndex > -1 && aggregationIndex < limitIndex;
};

helper.fillTimestampBuckets = function (buckets, start, aggregation, numberOfBins, offset, from, totalBuckets) {
  var startOffset = helper.isShorterThan('day', aggregation) ? (offset || 0) : 0;
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
    end: end !== -Infinity ? end : null
  };
};

helper.calculateDateRanges = function (min, max) {
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
