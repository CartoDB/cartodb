var InfowindowDefinitionModel = require('./infowindow-definition-model');
var fs = require('fs');

module.exports = InfowindowDefinitionModel.extend({

  defaults: {
    template_name: 'infowindow_light',
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
        fixed: '#35AAE5;',
        opacity: 1
      }
    }
  },

  TEMPLATES: {
    infowindow_none: fs.readFileSync(__dirname + '/../mustache-templates/infowindows/infowindow_none.jst.mustache', 'utf8'),
    infowindow_light: fs.readFileSync(__dirname + '/../mustache-templates/infowindows/infowindow_light.jst.mustache', 'utf8'),
    infowindow_dark: fs.readFileSync(__dirname + '/../mustache-templates/infowindows/infowindow_dark.jst.mustache', 'utf8'),
    infowindow_light_header_blue: fs.readFileSync(__dirname + '/../mustache-templates/infowindows/infowindow_light_header_blue.jst.mustache', 'utf8'),
    infowindow_header_with_image: fs.readFileSync(__dirname + '/../mustache-templates/infowindows/infowindow_header_with_image.jst.mustache', 'utf8'),
  },

  _transformTemplate: function (template) {
    var fixed = this.get('headerColor').color.fixed;

    return template.replace('background: #35AAE5;', 'background: ' + fixed + '; background-color:  ' + fixed + '; background-color: rgba( ' + fixed + ', ' + this.get('headerColor').color.opacity + ');');
  },

  setTemplate: function (templateName) {
    var template = (typeof (this.TEMPLATES[templateName]) === 'undefined') ? '' : this.TEMPLATES[templateName];

    if (this.fieldCount() > 0) {
      if (templateName === 'infowindow_light_header_blue') {
        template = this._transformTemplate(template);
      }
    } else {
      template = this.TEMPLATES['infowindow_none'];
    }

    var attrs = {
      'template_name': templateName,
      'template': template
    };

    if (templateName === '') {
      attrs.fields = [];
    }

    this.set(attrs);
  }

});
