var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');
var StyleConstants = require('builder/components/form-components/_constants/_style');

module.exports = {
  generate: function (params) {
    var filterFunction = function (item) {
      var columnType = item.get('type');
      return columnType && (columnType === 'number' || columnType === 'date');
    };

    if (params.styleType === StyleConstants.Type.HEATMAP) {
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
