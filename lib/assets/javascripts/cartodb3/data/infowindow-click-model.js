var InfowindowDefinitionModel = require('./infowindow-definition-model');

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

  _transformTemplate: function (template) {
    var fixed = this.get('headerColor').color.fixed;

    return template.replace('background: #35AAE5;', 'background: ' + fixed + '; background-color:  ' + fixed + '; background-color: rgba( ' + fixed + ', ' + this.get('headerColor').color.opacity + ');');
  },

  setTemplate: function (templateName) {
    var template = (typeof (this.TEMPLATES[templateName]) === 'undefined') ? '' : this.TEMPLATES[templateName];

    if (templateName === 'infowindow_light_header_blue') {
      template = this._transformTemplate(template);
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
