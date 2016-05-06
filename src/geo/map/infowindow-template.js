var Backbone = require('backbone');

var InfowindowTemplate = Backbone.Model.extend({
  defaults: {
    offset: [28, 0], // offset of the tip calculated from the bottom left corner
    maxHeight: 180, // max height of the content, not the whole infowindow
    template: '',
    alternative_names: { }
  },

  initialize: function (attrs) {
    attrs = attrs || {};
    this.fields = new Backbone.Collection(attrs.fields || []);
    this.unset('fields');
  },

  update: function (attrs) {
    this.fields.reset(attrs.fields);
    delete attrs.fields;

    this.set(attrs);
  },

  getFieldNames: function () {
    return this.fields.pluck('name');
  },

  hasFields: function () {
    return !this.fields.isEmpty();
  }
});

module.exports = InfowindowTemplate;
