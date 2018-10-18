var InfowindowDefinitionModel = require('./infowindow-definition-model');

module.exports = InfowindowDefinitionModel.extend({

  defaults: {
    template_name: '',
    latlng: [0, 0],
    offset: [28, 0], // offset of the tip calculated from the bottom left corner
    maxHeight: 180, // max height of the content, not the whole infowindow
    autoPan: true,
    template: '',
    content: '',
    visibility: false,
    alternative_names: { },
    fields: null, // contains the fields displayed in the infowindow,
    width: 226,
    headerColor: {
      color: {
        fixed: '#35AAE5',
        opacity: 1
      }
    }
  },

  TEMPLATES: {
    infowindow_light: require('builder/mustache-templates/infowindows/infowindow_light.jst.mustache'),
    infowindow_dark: require('builder/mustache-templates/infowindows/infowindow_dark.jst.mustache'),
    infowindow_color: require('builder/mustache-templates/infowindows/infowindow_color.jst.mustache'),
    infowindow_header_with_image: require('builder/mustache-templates/infowindows/infowindow_header_with_image.jst.mustache'),
    custom_infowindow_light: require('builder/mustache-templates/infowindows_custom/infowindow_light.jst.mustache'),
    custom_infowindow_dark: require('builder/mustache-templates/infowindows_custom/infowindow_dark.jst.mustache'),
    custom_infowindow_color: require('builder/mustache-templates/infowindows_custom/infowindow_color.jst.mustache'),
    custom_infowindow_header_with_image: require('builder/mustache-templates/infowindows_custom/infowindow_header_with_image.jst.mustache')
  },

  _transformTemplate: function (template) {
    var fixed = this.get('headerColor').color.fixed;

    return template.replace('background: #35AAE5', 'background: ' + fixed);
  },

  setTemplate: function (templateName) {
    var template = (typeof (this.TEMPLATES[templateName]) === 'undefined') ? '' : this.TEMPLATES[templateName];

    if (templateName === 'infowindow_color') {
      template = this._transformTemplate(template);
    }

    var attrs = {
      'template_name': templateName,
      'template': template,
      'template_type': 'mustache'
    };

    if (templateName === '') {
      attrs.fields = [];
    }

    this.set(attrs);
  },

  isEmptyTemplate: function () {
    var isEmpty = this.fieldCount() === 0;
    return this.hasTemplate() && isEmpty;
  },

  setDefault: function () {
    this.setTemplate(this.defaults.template_name);
  }

});
