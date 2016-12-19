var InfowindowDefinitionModel = require('./infowindow-definition-model');
var fs = require('fs');

module.exports = InfowindowDefinitionModel.extend({

  defaults: {
    vertical_offset: 0,
    horizontal_offset: 0,
    position: 'top|center',
    template_name: '',
    template: ''
  },

  TEMPLATES: {
    tooltip_dark: fs.readFileSync(__dirname + '/../mustache-templates/tooltips/tooltip_dark.jst.mustache', 'utf8'),
    tooltip_light: fs.readFileSync(__dirname + '/../mustache-templates/tooltips/tooltip_light.jst.mustache', 'utf8'),
    custom_tooltip_dark: fs.readFileSync(__dirname + '/../mustache-templates/tooltips_custom/tooltip_dark.jst.mustache', 'utf8'),
    custom_tooltip_light: fs.readFileSync(__dirname + '/../mustache-templates/tooltips_custom/tooltip_light.jst.mustache', 'utf8')
  },

  setDefault: function () {
    this.setTemplate(this.defaults.template_name);
  }

});
