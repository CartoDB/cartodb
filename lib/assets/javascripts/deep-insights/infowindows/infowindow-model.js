var _ = require('underscore');

var InfowindowModel = Backbone.Model.extend({
  defaults: {
    alternative_names: { },
    autoPan: true,
    content: '',
    headerColor: {
      color: {
        fixed: '#35AAE5',
        opacity: 1
      }
    },
    fields: [],
    latlng: [0, 0],
    maxHeight: 180, // max height of the content, not the whole infowindow
    offset: [28, 0], // offset of the tip calculated from the bottom left corner
    template_name: '',
    template: 'HOLA',
    template_type: '',
    visibility: false,
    width: 226
  },

  TEMPLATE_ATTRIBUTES: ['template', 'template_type', 'alternative_names', 'width', 'maxHeight', 'offset'],

  initialize: function () {},

  show: function () {
    this.set('visibility', true);
  },

  hide: function () {
    this.set('visibility', false);
  },

  isVisible: function () {
    return !!this.get('visibility');
  },

  isEmptyTemplate: function () {
    return this.get('fields').length === 0;
  },

  getAlternativeName: function (fieldName) {
    return this.get('alternative_names') && this.get('alternative_names')[fieldName];
  }
});

module.exports = InfowindowModel;
