var _ = require('underscore');
var Backbone = require('backbone');

/**
 * Usage:
 * var infowindowModel = new InfowindowModel({
 *   template_name: 'infowindow_light',
 *   latlng: [72, -45],
 *   offset: [100, 10]
 * });
 */
var InfowindowModel = Backbone.Model.extend({
  defaults: {
    offset: [28, 0], // offset of the tip calculated from the bottom left corner
    maxHeight: 180, // max height of the content, not the whole infowindow
    autoPan: true,
    template: '',
    template_name: 'infowindow_light',
    template_type: 'mustache',
    content: '',
    fields: null, // contains the fields displayed in the infowindow
    alternative_names: { }
  },

  TEMPLATE_ATTRIBUTES: ['fields', 'template_name', 'template', 'alternative_names', 'width', 'maxHeight', 'offset'],

  // updates content with attributes, if no attributes are given it only sets the content
  // with just the field names
  updateContent: function (attributes, options) {
    options = options || {};
    options = _.pick(options, 'showEmptyFields');
    var fields = this.get('fields');
    this.set('content', InfowindowModel.contentForFields(attributes, fields, options));
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

  getAlternativeName: function (fieldName) {
    return this.get('alternative_names') && this.get('alternative_names')[fieldName];
  },

  setInfowindowTemplate: function (infowindowTemplateModel) {
    this.set(_.pick(infowindowTemplateModel.toJSON(), this.TEMPLATE_ATTRIBUTES));
    this._infowindowTemplateModel = infowindowTemplateModel;
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
          title: field.title ? field.name : null,
          value: value || 'null',
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
