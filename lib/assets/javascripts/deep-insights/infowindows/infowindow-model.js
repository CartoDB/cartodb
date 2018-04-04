var contentFieldsUtil = require('../util/content-fields');
var infowindowDefaultTemplate = require('./templates/infowindow-template.tpl');

var InfowindowModel = Backbone.Model.extend({
  defaults: {
    offset: [28, 0], // offset of the tip calculated from the bottom left corner
    maxHeight: 180, // max height of the content, not the whole infowindow
    autoPan: true,
    template_type: 'mustache',
    content: '',
    alternative_names: { },
    visibility: false
  },

  DEFAULT_TEMPLATE: infowindowDefaultTemplate,

  TEMPLATE_ATTRIBUTES: ['template', 'template_type', 'alternative_names', 'width', 'maxHeight', 'offset'],

  initialize: function (attrs) {
    attrs = attrs || {};
    this._fields = new Backbone.Collection(attrs.fields || []);
    this.unset('fields', { silent: true });

    if (!this._hasTemplate()) { this._setDefaultTemplate(); }
  },

  updateContent: function (attributes, options) {
    options = options || {};
    options = _.pick(options, 'showEmptyFields');
    var fields = this._fields.toJSON();
    var content = contentFieldsUtil(attributes, fields, options);

    this.set('content', content);
  },

  setInfowindowTemplate: function (infowindowTemplateModel) {
    var attrs = _.pick(infowindowTemplateModel.toJSON(), this.TEMPLATE_ATTRIBUTES);
    // Remove keys that have a falsy value
    attrs = _.pick(attrs, _.identity);
    this.set(_.clone(attrs));
    this._fields.reset(infowindowTemplateModel.fields.toJSON());
    this._infowindowTemplateModel = infowindowTemplateModel;
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

  setLatLng: function (latLng) {
    this.set('latlng', latLng);
  },

  setMap: function (map) {
    this.set('map', map);
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

  setCurrentFeatureId: function (featureId) {
    this.set('currentFeatureId', featureId);
  },

  unsetCurrentFeatureId: function () {
    this.unset('currentFeatureId');
  },

  getCurrentFeatureId: function (featureId) {
    return this.get('currentFeatureId');
  },

  getAlternativeName: function (fieldName) {
    return this.get('alternative_names') && this.get('alternative_names')[fieldName];
  },

  hasInfowindowTemplate: function (infowindowTemplateModel) {
    return this._infowindowTemplateModel && this._infowindowTemplateModel === infowindowTemplateModel;
  },

  _hasTemplate: function () {
    return this.get('template') &&
      this.get('template').trim &&
      this.get('template').trim();
  },

  _setDefaultTemplate: function () {
    this.set({
      template: this.DEFAULT_TEMPLATE,
      template_type: 'underscore'
    });
  }
});

module.exports = InfowindowModel;
