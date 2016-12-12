var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');

function getQueryForGeometryType (geometryType) {
  var QUERY = 'select * from obs_legacybuildermetadata({{aggregate_type}})';

  var aggregate_type = '';
  if (geometryType === 'polygon') {
    aggregate_type = 'sum';
  }

  return QUERY.replace("'{{aggregate_type}}'", aggregate_type);
}

/**
 * this class fetches information from observatory metadata
 */
module.exports = Backbone.Model.extend({
  initialize: function (attrs, opts) {
    this._configModel = opts.configModel;
    this._geometryType = opts.geometryType;
  },

  sync: function (method, model, options) {
    var sql = new cdb.SQL({
      user: this._configModel.get('user_name'),
      sql_api_template: this._configModel.get('sql_api_template'),
      api_key: this._configModel.get('api_key')
    });
    sql.execute(getQueryForGeometryType(this._geometryType)).done(function (data) {
      options.success && options.success(data);
    }).error(function (errors) {
      // console.log("errors:" + errors);
    });
  },

  setGeometryType: function (geometryType) {
    this._geometryType = geometryType;
  },

  parse: function (attrs) {
    var a = {};
    _.each(attrs.rows, function (r) {
      var sub = {};
      _.each(r.subsection, function (s) {
        var cols = {};
        _.each(s.f1.columns, function (c) {
          cols[c.f1.name] = c.f1.id;
        });
        sub[s.f1.name] = cols;
      });
      a[r.name] = sub;
    });
    return a;
  },

  measurement: function (area) {
    var subsection = this.get(area);
    if (subsection) {
      return _.keys(subsection);
    }
    return [];
  },

  columns: function (area, subsectionName) {
    var subsection = this.get(area);
    if (subsection) {
      return _.keys(subsection[subsectionName] || {});
    }
    return [];
  },

  segment: function (area, subsectionName, column) {
    var subsection = this.get(area);
    if (subsection) {
      return subsection[subsectionName][column];
    }
    return null;
  },

  areas: function () {
    return _.keys(this.attributes);
  }
});
