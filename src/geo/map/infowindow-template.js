var _ = require('underscore');
var Backbone = require('backbone');

var InfowindowTemplate = Backbone.Model.extend({
  defaults: {
    offset: [28, 0], // offset of the tip calculated from the bottom left corner
    maxHeight: 180, // max height of the content, not the whole infowindow
    template: '',
    alternative_names: { },
    fields: [] // contains the fields displayed in the infowindow
  },

  update: function (attrs) {
    // Deep clone attrs so that attributes like fields are not references to original objects
    attrs = JSON.parse(JSON.stringify(attrs));
    this.set(attrs);
  },

  getFieldNames: function () {
    return _.pluck(this.get('fields'), 'name');
  },

  hasFields: function () {
    return this.get('fields').length > 0;
  }
});

module.exports = InfowindowTemplate;
