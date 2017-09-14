var Backbone = require('backbone');
var cdb = require('cartodb.js');
var _ = require('underscore');
var moment = require('moment');
var checkAndBuildOpts = require('../../helpers/required-opts');
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

  _calculateBuckets: function (max, min) {
    var end = moment(max);
    var start = moment(min);

    this.set('buckets', [{
      bins: Math.ceil(end.diff(start, 'minutes', true)) + 1,
      val: 'minute',
      label: 'Minutes'
    }, {
      bins: Math.ceil(end.diff(start, 'hours', true)) + 1,
      val: 'hour',
      label: 'Hours'
    }, {
      bins: Math.ceil(end.diff(start, 'days', true)) + 1,
      val: 'day',
      label: 'Days'
    }, {
      bins: Math.ceil(end.diff(start, 'weeks', true)) + 1,
      val: 'week',
      label: 'Weeks'
    }, {
      bins: Math.ceil(end.diff(start, 'months', true)) + 1,
      val: 'month',
      label: 'Months'
    }, {
      bins: Math.ceil(end.diff(start, 'quarters', true)) + 1,
      val: 'quarter',
      label: 'Quarters'
    }, {
      bins: Math.ceil(end.diff(start, 'years', true)) + 1,
      val: 'year',
      label: 'Years'
    }]);
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
