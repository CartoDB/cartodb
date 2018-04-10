const _ = require('underscore');
const Backbone = require('backbone');
const Pecan = require('cartodb-pecan');
const SQL = require('cartodb.js').SQL;
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel'
];

/**
 *  Pecan model
 *
 */

module.exports = Backbone.Model.extend({
  _PRINT_STATS: true,

  defaults: {
    table_id: '',
    column: '',
    state: 'idle'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    _.bindAll(this, '_onDescribe');

    console.warn('Check that SQL parameters are OK');
    this.sql = new SQL({
      username: this.userModel.get('username'),
      api_key: this.userModel.get('api_key')
    });

    this.query = `SELECT * FROM ${this.get('table_id')}`;
  },

  getData: function () {
    this.sql.describe(this.query, this.get('column'), {}, this._onDescribe);
  },

  _onDescribe: function (stats) {
    let properties = {
      state: 'analyzed',
      success: false
    };

    if (this._PRINT_STATS) {
      this.trigger('print_stats', stats, this);
    }

    const hasEnoughToGuess = Pecan.hasEnoughToGuess({
      stats: stats,
      isPointGeometryType: this.get('geometry_type') === 'point'
    });

    if (hasEnoughToGuess) {
      const response = Pecan.guessMap({
        tableName: this.get('table_id'),
        column: {
          stats: stats,
          geometryType: this.get('geometry_type'),
          bbox: this.get('bbox')
        },
        dependencies: {
          underscore: _
        }
      });

      if (response) {
        const overrides = {
          sql: this.query,
          success: true
        };
        properties = _.extend(properties, overrides, stats, response);
      }
    }

    if (stats.type === 'geom' && stats.bbox) {
      properties.bbox = stats.bbox;
    }

    this.set(properties);
  },

  isAnalyzed: function () {
    return this.get('state') === 'analyzed';
  },

  hasFailed: function () {
    return this.get('state') === 'failed';
  }

});
