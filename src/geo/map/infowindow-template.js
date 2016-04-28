var Backbone = require('backbone');

var InfowindowTemplate = Backbone.Model.extend({
  defaults: {
    offset: [28, 0], // offset of the tip calculated from the bottom left corner
    maxHeight: 180, // max height of the content, not the whole infowindow
    template: '',
    alternative_names: { },
    fields: null // contains the fields displayed in the infowindow
  },

  update: function (attrs) {
    this.set(attrs);
  }
});

module.exports = InfowindowTemplate;
