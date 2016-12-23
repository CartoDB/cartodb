var _ = require('underscore');
var Model = require('../../core/model');
var InfowindowModel = require('./infowindow-model');

var TooltipModel = Model.extend({
  defaults: {
    template: '<p>{{text}}</p>',
    fields: [],
    alternative_names: {},
    position: 'bottom|right',
    pos: { x: 0, y: 0 },
    offset: [0, 0],
    blacklisted_columns: ['cartodb_id']
  },

  getVerticalOffset: function () {
    var offset = this.get('offset');
    return (offset && offset[1]) || 0;
  },

  getHorizontalOffset: function () {
    var offset = this.get('offset');
    return (offset && offset[0]) || 0;
  },

  updateContent: function (attributes) {
    var data = attributes;
    var non_valid_keys = ['fields', 'content'];

    if (this.get('blacklisted_columns')) {
      non_valid_keys = non_valid_keys.concat(this.get('blacklisted_columns'));
    }

    var c = InfowindowModel.contentForFields(data, this.get('fields'), {
      show_empty_fields: false
    });

    // Remove fields and content from data
    // and make them visible for custom templates
    data.content = _.omit(data, non_valid_keys);

    // loop through content values
    data.fields = c.fields;

    // alternamte names
    var names = this.get('alternative_names');
    if (names) {
      for (var i = 0; i < data.fields.length; ++i) {
        var f = data.fields[i];
        f.title = names[f.title] || f.title;
      }
    }

    this.set('content', data);
  },

  isVisible: function () {
    return !!this.get('visible');
  }

  // setTooltipTemplate: function (tooltipTemplate) {
  //   this.set({
  //     template: tooltipTemplate.get('template'),
  //     fields: tooltipTemplate.fields.toJSON()
  //     alternative_names: tooltipTemplate.get('alternative_names')
  //   });
  // }
});

module.exports = TooltipModel;
