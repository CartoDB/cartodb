var contentFieldsUtil = require('../util/content-fields');

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
    template: '',
    template_type: '',
    visibility: false,
    width: 226
  },

  TEMPLATE_ATTRIBUTES: ['template', 'template_type', 'alternative_names', 'width', 'maxHeight', 'offset'],

  initialize: function () {
  },

  updateContent: function (attributes, options) {
    options = options || {};
    options = _.pick(options, 'showEmptyFields');
    var fields = this.get('fields');
    var content = contentFieldsUtil(attributes, fields, options);

    this.set('content', content);
  },

  setLoading: function () {
    this.set({
      content: {
        fields: [{
          type: 'loading',
          title: _t('infowindows.loading'),
          value: '…'
        }]
      }
    });
    return this;
  },

  setError: function () {
    this.set({
      content: {
        fields: [{
          title: null,
          alternative_name: null,
          value: _t('infowindows.error'),
          index: null,
          type: 'error'
        }],
        data: {}
      }
    });

    return this;
  },

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
