var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var ColumnsCollection = require('./columns-collection');

/**
 * Model representing a SQL table.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    // always incomplete to begin with, since the only way to currently get table data is by an individual request
    complete: false,
    schema: []
  },

  initialize: function (models, opts) {
    if (!opts.baseUrl) throw new Error('baseUrl is required');
    if (!opts.configModel) throw new Error('configModel is required');
    this._baseUrl = opts.baseUrl;
    this._configModel = opts.configModel;

    this.columnsCollection = new ColumnsCollection([], {
      baseUrl: this._baseUrl,
      configModel: this._configModel,
      tableModel: this
    });
  },

  url: function () {
    var version = this._configModel.apiUrlVersion('table');
    return _.result(this, '_baseUrl') + '/api/' + version + '/tables/' + this.get('name');
  },

  parse: function (response) {
    response.complete = true;

    var columnsAttrs = _.map(response.schema, function (d) {
      return {
        name: d[0],
        type: d[1]
      };
    }, this);
    this.columnsCollection.reset(columnsAttrs);

    return response;
  }
});
