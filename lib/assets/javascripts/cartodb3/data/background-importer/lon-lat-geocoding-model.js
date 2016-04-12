var cdb = require('cartodb.js');
var _ = require('underscore');

/**
 * A special case of a geocoding model, since lon/lat geocoding is not actually going through the common async processing
 * as the rest.
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs) {
    if (!attrs.table) throw new Error('table is required');
    if (!attrs.longitude_column) throw new Error('longitude_column is required');
    if (!attrs.latitude_column) throw new Error('latitude_column is required');
    if (!_.isBoolean(attrs.force_all_rows)) throw new Error('force_all_rows is required');

    this.set('table_name', attrs.table.get('name'));

    this._startGeocoding();
  },

  _startGeocoding: function () {
    this._changeState('isOngoing');

    var self = this;
    var table = this.get('table');
    table.save({
      longitude_column: this.get('longitude_column'),
      latitude_column: this.get('latitude_column'),
      force_all_rows: this.get('force_all_rows')
    }, {
      success: function () {
        // when finish fetch the data again and throw a signal to notify the changes
        // TODO: this should not exist, geometry_types change should be monitored
        table.trigger('geolocated');
        table.data().fetch();
        self._changeState('hasCompleted');
      },
      error: function (msg, resp) {
        var error;
        try {
          error = resp && JSON.parse(resp.responseText).errors[0];
        } catch (err) {
          // e.g. if responseText is empty (seems to happen when server is down/offline)
          error = 'Unknown error';
        }
        self.set('error', error);
        self._changeState('hasFailed');
      },
      wait: true // don't update attrs until success is triggered
    });
  },

  isOngoing: function () {
    return this.get('isOngoing');
  },

  hasCompleted: function () {
    return this.get('hasCompleted');
  },

  hasFailed: function () {
    return this.get('hasFailed');
  },

  getError: function () {
    return this.get('error');
  },

  _changeState: function (newState) {
    var changedStates = _.reduce(['isOngoing', 'hasCompleted', 'hasFailed'], function (memo, state) {
      memo[state] = state === newState;
      return memo;
    }, {});
    this.set(changedStates);
  }

});
