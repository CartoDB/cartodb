var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');

function getQueryForGeometryType (geometryType) {
  var QUERY = [
    'select tag.name, to_json(ARRAY(',
    '  select row_to_json(',
    '    (select row(_) from (select o.name, o.id, array_agg(',
    '      (select row(__) from (select tt.name, tt.id) as __)',
    '    ) as columns) as _)',
    '  )',
    '  from obs_tag o ',
    '  join obs_column_tag t on t.tag_id = o.id and t.column_id in (select ttt.column_id from obs_column_tag ttt where ttt.tag_id = tag.id)',
    '  join obs_column tt on tt.id = t.column_id',
    "  where o.name != 'Boundaries'",
    "    and o.type = 'subsection'",
    '    and tt.weight > 0 ',
    '    {{aggregate_condition}}',
    '  group by o.name, o.id',
    ')) as subsection',
    "from obs_tag tag where type = 'section'"
  ].join('\n');

  var replacement = '';
  if (geometryType === 'polygon') {
    replacement = "and tt.aggregate ILIKE 'sum'";
  }
  return QUERY.replace('{{aggregate_condition}}', replacement);
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
    // TODO: use configuration for data observatory
    var sql = cdb.SQL({ user: 'observatory' });
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
