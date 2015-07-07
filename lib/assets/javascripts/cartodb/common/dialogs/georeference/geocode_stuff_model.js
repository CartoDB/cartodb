var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * Simple object for common logic in the georeference modal, e.g. for available geometries, and
 * creating chosen geocoding data, etc.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    tableName: undefined,
    forceAllRows: false
  },

  initialie: function(attrs) {
    if (!attrs.tableName) throw new Error('tableName is required');
  },

  /**
   * @param {String} kind
   * @param {String} location
   * @param {Boolean} isLocationFreeText
   * @return {Object} hash
   */
  availableGeometriesFetchData: function(kind, location, isLocationFreeText) {
    if (!kind) throw new Error('kind is required');

    var d = {
      kind: kind
    };

    if (_.isEmpty(location)) {
      d.free_text = 'World';
    } else {
      if (isLocationFreeText) {
        d.free_text = location;
      } else {
        d.column_name = location;
        d.table_name = this.get('tableName');
      }
    }

    return d;
  },

  // @return {Boolean} true if location is considered a "world" geocoding search value.
  isLocationWorld: function(location, isFreeText) {
    return location === '' || (!!isFreeText && location.search('world') !== -1);
  },

  /**
   * Creates the expected data for the 'geocodingChosen' event on the cdb.god model.
   * Adheres to the existing workflow and was extracted from old views.
   * @param {Object} d
   * @param {Boolean} isLocationFreeText true if location prop was created through a free-text input field, and
   *  false if matches a column name on the table
   * @return {Object}
   */
  geocodingChosenData: function(d, isLocationFreeText) {
    d.table_name = this.get('tableName');

    if (this.isLocationWorld(d.location, isLocationFreeText)) {
      d.location = 'world';
      d.text = true; // Set free text
    } else if (_.isBoolean(isLocationFreeText)) {
      d.text = isLocationFreeText;
    }

    if (this.get('forceAllRows')) {
      d.force_all_rows = true;
    }

    return d;
  }

});
