var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');

module.exports = cdb.core.Model.extend({

  SYSTEM_COLUMNS: ['the_geom', 'the_geom_webmercator', 'created_at', 'updated_at', 'cartodb_id', 'cartodb_georef_status'],

  defaults: {
    template_name: 'infowindow_light',
    latlng: [0, 0],
    offset: [28, 0], // offset of the tip calculated from the bottom left corner
    maxHeight: 180, // max height of the content, not the whole infowindow
    autoPan: true,
    template: "",
    content: "",
    visibility: false,
    alternative_names: { },
    fields: null // contains the fields displayed in the infowindow
  },

  parse: function (r, opts) {
    r.options = r.options || {};

    // Flatten the rest of the attributes
    return attrs;
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
  },

  containsField: function(fieldName) {
    var fields = this.get('fields') || [];
    return _.contains(_(fields).pluck('name'), fieldName);
  },

  getFieldProperty: function(fieldName, k) {
    if(this.containsField(fieldName)) {
      var fields = this.get('fields') || [];
      var idx = _.indexOf(_(fields).pluck('name'), fieldName);
      return fields[idx][k];
    }
    return null;
  },

  _cloneFields: function() {
    return _(this.get('fields')).map(function(v) {
      return _.clone(v);
    });
  },

  _setFields: function(f) {
    f.sort(function(a, b) { return a.position -  b.position; });
    this.set({'fields': f});
  },

  setFieldProperty: function(fieldName, k, v) {
    if(this.containsField(fieldName)) {
      var fields = this._cloneFields() || [];
      var idx = _.indexOf(_(fields).pluck('name'), fieldName);
      fields[idx][k] = v;
      this._setFields(fields);
    }
    return this;
  },

  getFieldPos: function(fieldName) {
    var p = this.getFieldProperty(fieldName, 'position');
    if(p == undefined) {
      return Number.MAX_VALUE;
    }
    return p;
  },

  fieldCount: function() {
    var fields = this.get('fields')
    if (!fields) return 0;
    return fields.length
  }

});
