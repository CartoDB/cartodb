var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');

module.exports = {
  generate: function (params) {
    var filterFunction = function (item) {
      var columnType = item.get('type');
      if (columnType && (columnType === 'number' || columnType === 'date')) {
        return true;
      }
      return false;
    };

    if (params.styleType === 'heatmap') {
      return StyleFormDictionaryHelpers.generateSelectWithSchemaColumns({
        componentName: 'animated-attribute',
        querySchemaModel: params.querySchemaModel,
        filterFunction: filterFunction
      });
    }

    return StyleFormDictionaryHelpers.generateSelectByStyleType({
      componentName: 'animated-attribute',
      querySchemaModel: params.querySchemaModel,
      filterFunction: filterFunction,
      styleType: params.styleType
    });
  }
};
