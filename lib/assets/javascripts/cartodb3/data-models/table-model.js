var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');

/**
 * Model representing a SQL table.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    // always incomplete to begin with, since the only way to currently get table data is by an individual request
    incomplete: true
  },

  initialize: function (models, opts) {
    if (!opts.baseUrl) throw new Error('baseUrl is required');
    this._baseUrl = opts.baseUrl;
  },

  url: function () {
    var version = cdb.config.apiUrlVersion('table');
    return _.result(this, '_baseUrl') + '/api/' + version + '/tables/' + this.get('name');
  },

  parse: function (response) {
    response.incomplete = false;
    return response;
  }
});
