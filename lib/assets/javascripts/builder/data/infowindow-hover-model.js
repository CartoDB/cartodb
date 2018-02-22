var InfowindowDefinitionModel = require('./infowindow-definition-model');

module.exports = InfowindowDefinitionModel.extend({

  defaults: {
    vertical_offset: 0,
    horizontal_offset: 0,
    position: 'top|center',
    template_name: '',
    template: ''
  },

  TEMPLATES: {
    tooltip_dark: require('builder/mustache-templates/tooltips/tooltip_dark.jst.mustache'),
    tooltip_light: require('builder/mustache-templates/tooltips/tooltip_light.jst.mustache'),
    custom_tooltip_dark: require('builder/mustache-templates/tooltips_custom/tooltip_dark.jst.mustache'),
    custom_tooltip_light: require('builder/mustache-templates/tooltips_custom/tooltip_light.jst.mustache')
  },

  setDefault: function () {
    this.setTemplate(this.defaults.template_name);
  }

});
