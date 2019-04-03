var _ = require('underscore');
var Backbone = require('backbone');
var PopupFields = require('./popup-fields');

var TooltipTemplate = Backbone.Model.extend({
  defaults: {
    vertical_offset: 0,
    horizontal_offset: 0,
    position: 'top|center',
    template: '',
    alternative_names: { }
  },

  initialize: function (attrs) {
    attrs = attrs || {};
    this.fields = new PopupFields(attrs.fields || []);
    this.unset('fields');
  },

  update: function (attrs) {
    attrs = _.clone(attrs);

    if (!this.fields.equals(attrs.fields)) {
      this.fields.reset(attrs.fields);
    }
    delete attrs.fields;

    if (attrs.alternative_names) {
      attrs.alternative_names = JSON.parse(JSON.stringify(attrs.alternative_names));
    }

    this.set(attrs);
  },

  getFieldNames: function () {
    return this.fields.pluck('name');
  },

  hasFields: function () {
    return !this.fields.isEmpty();
  },

  hasTemplate: function () {
    return !!this.get('template');
  }
});

module.exports = TooltipTemplate;
