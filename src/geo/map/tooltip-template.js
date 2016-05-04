var _ = require('underscore');
var Backbone = require('backbone');

var TooltipTemplate = Backbone.Model.extend({
  defaults: {
    vertical_offset: 0,
    horizontal_offset: 0,
    position: 'top|center',
    template: '',
    alternative_names: { },
    fields: []
  },

  update: function (attrs) {
    this.set(attrs);
  },

  getFieldNames: function () {
    return _.pluck(this.get('fields'), 'name');
  },

  hasFields: function () {
    return this.get('fields').length > 0;
  }
});

module.exports = TooltipTemplate;
