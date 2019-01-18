var _ = require('underscore');
var BaseModel = require('builder/components/custom-list/custom-list-item-model');
var $ = require('jquery');
var cdb = require('internal-carto.js');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'configModel',
  'nodeDefModel'
];

var MEASUREMENT_ATTRIBUTES = ['aggregate', 'type', 'label', 'val', 'description', 'filter', 'license'];

var MEASUREMENT_BY_ID = 'SELECT numer_id, numer_name, numer_description, numer_type, numer_aggregate, numer_tags FROM _OBS_GetNumerators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), section_tags => {{{ area }}}, ids => {{{ measurement }}})';

module.exports = BaseModel.extend({
  initialize: function (attrs, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._querySchemaModel = this._nodeDefModel.querySchemaModel;

    var configModel = options.configModel;
    this.SQL = new cdb.SQL({
      user: configModel.get('user_name'),
      sql_api_template: configModel.get('sql_api_template'),
      api_key: configModel.get('api_key')
    });

    BaseModel.prototype.initialize.call(this, attrs, options);
  },

  fetch: function (options) {
    var defaults = {
      area: null,
      measurement: null,
      query: this._querySchemaModel.get('query')
    };

    this.deferred = $.Deferred();
    var queryOptions = _.defaults(options, defaults);

    this.set('state', 'fetching');
    this.SQL.execute(MEASUREMENT_BY_ID, queryOptions, {
      success: function (data) {
        this._onFetchSuccess(data);
        this.set('state', 'fetched');
        this.deferred.resolve();
      }.bind(this),
      error: function () {
        this.set('state', 'error');
        this.deferred.reject();
      }.bind(this)
    });

    return this.deferred.promise();
  },

  isFetching: function () {
    return this.getState() === 'fetching';
  },

  getState: function () {
    return this.get('state');
  },

  _onFetchSuccess: function (data) {
    var model = _.first(data.rows);

    if (!model) {
      this._clear();
      return;
    }

    var o = {};
    // label and val to custom list compatibility
    o.val = model.numer_id;
    o.label = model.numer_name;
    o.description = model.numer_description;
    o.type = model.numer_type;
    o.aggregate = model.numer_aggregate;
    // a measurement can belong to more than one category (filter)
    o.filter = [];
    var tags = model.numer_tags;
    if (!_.isObject(tags)) {
      tags = JSON.parse(tags);
    }

    for (var key in tags) {
      if (/^subsection/.test(key)) {
        o.filter.push({
          id: key,
          name: tags[key]
        });
      }

      if (/^license/.test(key)) {
        o.license = tags[key];
      }
    }

    this.set(o);
  },

  _clear: function (options) {
    var attrs = MEASUREMENT_ATTRIBUTES.reduce(function (memo, attr) {
      memo[attr] = null;
      return memo;
    }, {});

    this.set(attrs, {silent: true});
  }
});
