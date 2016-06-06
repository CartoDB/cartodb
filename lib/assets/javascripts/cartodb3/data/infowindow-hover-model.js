var InfowindowDefinitionModel = require('./infowindow-definition-model');

module.exports = InfowindowDefinitionModel.extend({

  defaults: {
    vertical_offset: 0,
    horizontal_offset: 0,
    position: 'top|center'
  }

});
