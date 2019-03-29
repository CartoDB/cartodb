var Backbone = require('backbone');
var cdb = require('internal-carto.js');
var _ = require('underscore');
var moment = require('moment');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var QUERY_TEMPLATE = _.template('SELECT MAX(<%= column %>), MIN(<%= column %>) FROM (<%= table %>) __wrapped');

var STATUS = {
  unavailable: 'unavailable',
  unfetched: 'unfetched',
  fetching: 'fetching',
  fetched: 'fetched'
};

var DEFAULT_MAX_BUCKETS = 367;

var REQUIRED_OPTS = [
  'configModel',
  'querySchemaModel'
];

module.exports = Backbone.Model.extend({
  defaults: {
    status: STATUS.unfetched,
    buckets: []
  },

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    if (!_.has(attrs, 'column')) {
      throw new Error('Column is required');
    }

    this._SQL = new cdb.SQL({
      user: this._configModel.get('user_name'),
      sql_api_template: this._configModel.get('sql_api_template'),
      api_key: this._configModel.get('api_key')
    });

    this._initBinds();

    if (this._querySchemaModel.get('status') === STATUS.fetched) {
      this._queryData();
    }
  },

  _initBinds: function () {
    this.on('change:column', this._queryData, this);
    this.listenTo(this._querySchemaModel, 'change:status', this._onQuerySchemaStatusChanged);
  },

  _onQuerySchemaStatusChanged: function () {
    if (this._querySchemaModel.get('status') === STATUS.fetched) {
      this._queryData();
    }
  },

  _queryData: function () {
    if (this._querySchemaModel.getColumnType(this.get('column')) !== 'date') {
      return;
    }

    var query = QUERY_TEMPLATE({
      column: this.get('column'),
      table: this._querySchemaModel.get('query')
    });

    var callback = {
      success: this._onQuerySuccess.bind(this),
      error: this._onQueryError.bind(this)
    };

    this.set('status', STATUS.fetching);
    this._SQL.execute(query, null, callback);
  },

  _onQuerySuccess: function (data) {
    this.set('status', STATUS.fetched);
    var row = data.rows && data.rows[0];
    var max = row && row.max ? row.max : 0;
    var min = row && row.min ? row.min : 0;
    this._calculateBuckets(max, min);
  },

  _onQueryError: function () {
    this.set('status', STATUS.unavailable);
  },

  _calculateDecadesDiff: function (start, end) {
    var startYear = start.year();
    var endYear = end.year();
    var startDecade = Math.floor(startYear / 10);
    var endDecade = Math.floor((endYear + 10) / 10);

    return endDecade - startDecade;
  },

  _calculateBuckets: function (max, min) {
    var end = moment(max).utc();
    var start = moment(min).utc();
    var BUCKET_INCREMENT = 1;

    var buckets = [{
      bins: end.diff(start, 'minutes', true),
      val: 'minute',
      label: 'Minutes'
    }, {
      bins: end.diff(start, 'hours', true),
      val: 'hour',
      label: 'Hours'
    }, {
      bins: end.diff(start, 'days', true),
      val: 'day',
      label: 'Days'
    }, {
      bins: end.diff(start, 'weeks', true),
      val: 'week',
      label: 'Weeks'
    }, {
      bins: end.diff(start, 'months', true),
      val: 'month',
      label: 'Months'
    }, {
      bins: end.diff(start, 'quarters', true),
      val: 'quarter',
      label: 'Quarters'
    }, {
      bins: end.diff(start, 'years', true),
      val: 'year',
      label: 'Years'
    }, {
      bins: this._calculateDecadesDiff(start, end),
      val: 'decade',
      label: 'Decades'
    }];

    var incrementedBuckets = _.map(buckets, function (bucket) {
      var increment = bucket.val === 'decade'
        ? 0
        : BUCKET_INCREMENT;

      return _.extend(_.clone(bucket), {
        bins: Math.ceil(bucket.bins) + increment
      });
    });

    this.set('buckets', incrementedBuckets);
  },

  getFilteredBuckets: function (max) {
    var limit = max || DEFAULT_MAX_BUCKETS;
    var buckets = _.filter(this.get('buckets'), function (bucket) {
      return bucket.bins <= limit;
    });

    return buckets;
  },

  getPreferredBucket: function (max) {
    var sortedBuckets = _.sortBy(this.getFilteredBuckets(max), 'bins');
    return sortedBuckets.length > 0 ? sortedBuckets[sortedBuckets.length - 1] : {};
  }
});
