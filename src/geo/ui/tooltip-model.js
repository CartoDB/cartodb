var _ = require('underscore');
var Model = require('../../core/model');
var InfowindowModel = require('./infowindow-model');

var TooltipModel = Model.extend({
  defaults: {
    template: '<p>{{text}}</p>',
    fields: [],
    alternative_names: {},
    placement: 'bottom|right',
    position: { x: 0, y: 0 },
    offset: [0, 0],
    blacklisted_columns: ['cartodb_id']
  },

  updateContent: function (attributes) {
    var data = attributes;
    var nonValidKeys = ['fields', 'content'];

    if (this.get('blacklisted_columns')) {
      nonValidKeys = nonValidKeys.concat(this.get('blacklisted_columns'));
    }

    var c = InfowindowModel.contentForFields(data, this.get('fields'), {
      show_empty_fields: false
    });

    // Remove fields and content from data
    // and make them visible for custom templates
    data.content = _.omit(data, nonValidKeys);

    // loop through content values
    data.fields = c.fields;

    // alternamte names
    var names = this.get('alternative_names');
    if (names) {
      data.fields.forEach(function (field) {
        field.title = names[field.title] || field.title;
      });
    }

    this.set('content', data);
  },

  setTooltipTemplate: function (tooltipTemplate) {
    this.set({
      template: tooltipTemplate.get('template'),
      fields: tooltipTemplate.fields.toJSON(),
      alternative_names: tooltipTemplate.get('alternative_names')
    });
  },

  setPosition: function (position) {
    this.set('position', position);
  },

  show: function () {
    this.set('visible', true);
  },

  hide: function () {
    this.set('visible', false);
  },

  isVisible: function () {
    return !!this.get('visible');
  },

  getVerticalOffset: function () {
    var offset = this.get('offset');
    return (offset && offset[1]) || 0;
  },

  getHorizontalOffset: function () {
    var offset = this.get('offset');
    return (offset && offset[0]) || 0;
  }
});

module.exports = TooltipModel;
