var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');

module.exports = {
  generate: function (params) {
    var strokeParams = {
      querySchemaModel: params.querySchemaModel,
      styleType: params.styleType,
      configModel: params.configModel,
      userModel: params.userModel,
      modals: params.modals
    };

    if (params.queryGeometryModel.get('simple_geom') === 'line') {
      return StyleFormDictionaryHelpers.generateLineStroke(strokeParams);
    }

    return StyleFormDictionaryHelpers.generateSimpleStroke(strokeParams, params.queryGeometryModel.get('simple_geom'));
  }
};
