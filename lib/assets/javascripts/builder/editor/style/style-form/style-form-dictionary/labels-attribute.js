var StyleFormDictionaryHelpers = require('builder/editor/style/style-form/style-form-helpers');

module.exports = {
  generate: function (params) {
    var filterFunction = function (item) {
      var columnName = item.get('name');
      var columnType = item.get('type');
      return columnName !== 'the_geom' && columnName !== 'the_geom_webmercator' && columnType !== 'date';
    };

    return StyleFormDictionaryHelpers.generateSelectByStyleType({
      componentName: 'labels-attribute',
      querySchemaModel: params.querySchemaModel,
      styleType: params.styleType,
      filterFunction: filterFunction
    });
  }
};
