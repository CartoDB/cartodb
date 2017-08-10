var _ = require('underscore');
var Backbone = require('backbone');
var defaultInfowindowTemplate = require('./default-infowindow-template.tpl');

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

  DEFAULT_TEMPLATE: defaultInfowindowTemplate,

  TEMPLATE_ATTRIBUTES: ['template', 'template_type', 'alternative_names', 'width', 'maxHeight', 'offset'],

  initialize: function (attrs) {
    attrs = attrs || {};
    this._fields = new Backbone.Collection(attrs.fields || []);
    this.unset('fields', { silent: true });

    // Set a default template
    if (!this._hasTemplate()) {
      this.set({
        template: this.DEFAULT_TEMPLATE,
        template_type: 'underscore'
      });
    }
  },

  _hasTemplate: function () {
    return this.get('template') && this.get('template').trim && this.get('template').trim();
  },

  updateContent: function (attributes, options) {
    options = options || {};
    options = _.pick(options, 'showEmptyFields');
    var fields = this._fields.toJSON();
    this.set('content', InfowindowModel.contentForFields(attributes, fields, options));
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
          title: 'loading',
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
          value: 'There has been an error...',
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
  }
}, {
  contentForFields: function (attributes, fields, options) {
    options = options || {};
    var render_fields = [];

    for (var j = 0; j < fields.length; ++j) {
      var field = fields[j];
      var value = attributes[field.name];
      if (options.showEmptyFields || (value !== undefined && value !== null)) {
        render_fields.push({
          name: field.name,
          title: field.title ? field.name : null,
          value: (value !== undefined && value !== null) ? value : null,
          index: j
        });
      }
    }

    // manage when there is no data to render
    if (render_fields.length === 0) {
      render_fields.push({
        title: null,
        value: 'No data available',
        index: 0,
        type: 'empty'
      });
    }

    return {
      fields: render_fields,
      data: attributes
    };
  }
});

module.exports = InfowindowModel;
