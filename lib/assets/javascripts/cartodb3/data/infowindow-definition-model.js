var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var fs = require('fs');

cdb.templates.add({
  name: 'infowindow_light',
  compiled: cdb.core.Template.compile(fs.readFileSync(__dirname + '/../mustache-templates/infowindows/infowindow_light.jst.mustache', 'utf8'), 'mustache')
});
cdb.templates.add({
  name: 'infowindow_dark',
  compiled: cdb.core.Template.compile(fs.readFileSync(__dirname + '/../mustache-templates/infowindows/infowindow_dark.jst.mustache', 'utf8'), 'mustache')
});
cdb.templates.add({
  name: 'infowindow_light_header_blue',
  compiled: cdb.core.Template.compile(fs.readFileSync(__dirname + '/../mustache-templates/infowindows/infowindow_light_header_blue.jst.mustache', 'utf8'), 'mustache')
});
cdb.templates.add({
  name: 'infowindow_header_with_image',
  compiled: cdb.core.Template.compile(fs.readFileSync(__dirname + '/../mustache-templates/infowindows/infowindow_header_with_image.jst.mustache', 'utf8'), 'mustache')
});
cdb.templates.add({
  name: 'tooltip_dark',
  compiled: cdb.core.Template.compile(fs.readFileSync(__dirname + '/../mustache-templates/tooltips/tooltip_dark.jst.mustache', 'utf8'), 'mustache')
});
cdb.templates.add({
  name: 'tooltip_light',
  compiled: cdb.core.Template.compile(fs.readFileSync(__dirname + '/../mustache-templates/tooltips/tooltip_light.jst.mustache', 'utf8'), 'mustache')
});

module.exports = cdb.core.Model.extend({

  SYSTEM_COLUMNS: ['the_geom', 'the_geom_webmercator', 'created_at', 'updated_at', 'cartodb_id', 'cartodb_georef_status'],

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
  },

  clearFields: function () {
    this.set({ 'fields': [] });
  },

  saveFields: function (where) {
    where = where || 'old_fields';
    this.set(where, _.clone(this.get('fields')));
  },

  fieldCount: function () {
    var fields = this.get('fields');
    if (!fields) return 0;
    return fields.length;
  },

  restoreFields: function (whiteList, from) {
    from = from || 'old_fields';
    var fields = this.get(from);
    if (whiteList) {
      fields = fields.filter(function (f) {
        return _.contains(whiteList, f.name);
      });
    }
    if (fields && fields.length) {
      this._setFields(fields);
    }
    this.unset(from);
  },

  containsField: function (fieldName) {
    var fields = this.get('fields') || [];
    return _.contains(_(fields).pluck('name'), fieldName);
  },

  getFieldProperty: function (fieldName, k) {
    if (this.containsField(fieldName)) {
      var fields = this.get('fields') || [];
      var idx = _.indexOf(_(fields).pluck('name'), fieldName);
      return fields[idx][k];
    }
    return null;
  },

  setFieldProperty: function (fieldName, k, v) {
    if (this.containsField(fieldName)) {
      var fields = this._cloneFields() || [];
      var idx = _.indexOf(_(fields).pluck('name'), fieldName);
      fields[idx][k] = v;
      this._setFields(fields);
    }
    return this;
  },

  _cloneFields: function () {
    return _(this.get('fields')).map(function (v) {
      return _.clone(v);
    });
  },

  _setFields: function (f) {
    f.sort(function (a, b) { return a.position - b.position; });
    this.set({ 'fields': f });
  },

  sortFields: function () {
    this.get('fields').sort(function (a, b) { return a.position - b.position; });
  },

  _addField: function (fieldName, at) {
    var dfd = $.Deferred();
    if (!this.containsField(fieldName)) {
      var fields = this.get('fields');

      if (fields) {
        at = at === undefined ? fields.length : at;
        fields.push({ name: fieldName, title: true, position: at });
      } else {
        at = at === undefined ? 0 : at;
        this.set('fields', [{ name: fieldName, title: true, position: at }], { silent: true });
      }
    }
    dfd.resolve();
    return dfd.promise();
  },

  addField: function (fieldName, at) {
    var self = this;
    $.when(this._addField(fieldName, at)).then(function () {
      self.sortFields();
      self.trigger('add:fields');
      self.trigger('change:fields', self, self.get('fields'));
      self.trigger('change', self);
    });
    return this;
  },

  removeField: function (fieldName) {
    if (this.containsField(fieldName)) {
      var fields = this._cloneFields() || [];
      var idx = _.indexOf(_(fields).pluck('name'), fieldName);
      if (idx >= 0) {
        fields.splice(idx, 1);
      }
      this._setFields(fields);
      this.trigger('remove:fields');
    }
    return this;
  },

  getAlternativeName: function (fieldName) {
    return this.get('alternative_names') && this.get('alternative_names')[fieldName];
  },

  setAlternativeName: function (fieldName, alternativeName) {
    var alternativeNames = _.clone(this.get('alternative_names') || {});

    alternativeNames[fieldName] = alternativeName;
    this.set({ 'alternative_names': alternativeNames });
    this.trigger('change:alternative_names');
  },

  getFieldPos: function (fieldName) {
    var p = this.getFieldProperty(fieldName, 'position');
    if (p === undefined) {
      return Number.MAX_VALUE;
    }
    return p;
  },

  setTemplate: function (templateName) {
    this.set({ 'template_name': templateName });
  }

});
