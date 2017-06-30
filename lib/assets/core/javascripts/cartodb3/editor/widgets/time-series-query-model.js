var Backbone = require('backbone');
var cdb = require('cartodb.js');
var _ = require('underscore');
var moment = require('moment');
var checkAndBuildOpts = require('../../helpers/required-opts');
var QUERY_TEMPLATE = _.template("SELECT DATE_PART('day', MAX(<%= column %>)::timestamp - MIN(<%= column %>)::timestamp) FROM (<%= table %>) __wrapped");

var STATUS = {
  unavailable: 'unavailable',
  unfetched: 'unfetched',
  fetching: 'fetching',
  fetched: 'fetched'
};

var DEFAULT_MAX_BUCKETS = 366;

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

    this.on('change:column', this._queryData, this);
    this.listenTo(this._querySchemaModel, 'change:status', this._onQuerySchemaStatusChanged);

    if (this._querySchemaModel.get('status') === STATUS.fetched) {
      this._queryData();
    }
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
      error: this._onQueryError.bind(this),
    };

    this.set('status', STATUS.fetching);
    this._SQL.execute(query, null, callback);
  },

  _onQuerySuccess: function (data) {
    this.set('status', STATUS.fetched);
    var row = data.rows && data.rows[0];
    var days = row && row.date_part ? row.date_part : 0;
    this._calculateBuckets(days);
  },

  _onQueryError: function () {
    this.set('status', STATUS.unavailable);
  },

  _calculateBuckets: function (days) {
    var duration = moment.duration(days, 'days');
    var years = Math.ceil(duration.asYears());

    this.set('buckets', [{
      bins: Math.ceil(duration.asMinutes()),
      val: 'minute',
      label: 'Minutes'
    }, {
      bins: Math.ceil(duration.asHours()),
      val: 'hour',
      label: 'Hours'
    }, {
      bins: days,
      val: 'day',
      label: 'Days'
    }, {
      bins: Math.ceil(duration.asWeeks()),
      val: 'week',
      label: 'Weeks'
    }, {
      bins: Math.ceil(duration.asMonths()),
      val: 'month',
      label: 'Months'
    }, {
      bins: years * 4,
      val: 'quarter',
      label: 'Quarters'
    }, {
      bins: years,
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
