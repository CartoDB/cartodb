var _ = require('underscore');
var Model = require('../../../core/model');

/**
 * contains information about the table, mainly the schema
 */
var TableProperties = Model.extend({

  columnNames: function() {
    return _.map(this.get('schema'), function(c) {
      return c[0];
    });
  },

  columnName: function(idx) {
    return this.columnNames()[idx];
  }
});

module.exports = TableProperties;
