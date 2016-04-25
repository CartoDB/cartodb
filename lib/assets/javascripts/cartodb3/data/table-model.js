var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var TableColumnsCollection = require('./table-columns-collection');
var TableQueryModel = require('./table-query-model');
var getSimpleGeometryType = require('./get-simple-geometry-type');

/**
 * Model representing a table.
 */
module.exports = cdb.core.Model.extend({

  idAttribute: 'name',

  defaults: {
    // always not fetched to begin with, since the only way to currently get table data is by an individual request
    fetched: false,
    schema: []
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;

    this.columnsCollection = new TableColumnsCollection([], {
      configModel: this._configModel,
      tableModel: this
    });
  },

  urlRoot: function () {
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('table');
    return baseUrl + '/api/' + version + '/tables';
  },

  parse: function (r) {
    var attrs = _.defaults({
      fetched: true
    }, r);

    attrs.tableQueryModel = new TableQueryModel({}, {
      configModel: this._configModel,
      tableModel: this
    });

    var columnsAttrs = _.map(r.schema, function (d) {
      return {
        name: d[0],
        type: d[1]
      };
    }, this);
    this.columnsCollection.reset(columnsAttrs);

    return attrs;
  },

  getGeometryType: function () {
    var types = this.get('geometry_types');
    var geomTypes = [];
    if (!_.isArray(types)) {
      return [];
    }

    for (var t in types) {
      var type = types[t];
      // when there are rows with no geo type null is returned as geotype
      if (type) {
        var a = getSimpleGeometryType(type.toLowerCase());
        if (a) {
          geomTypes.push(a);
        }
      }
    }

    return _.uniq(geomTypes);
  }
});
