var _ = require('underscore');
var WidgetsFormColumnOptionsFactory = require('./widgets-form-column-options-factory');

var dataMap = {
  category: {
    labelTranslationKey: 'editor.widgets.widgets-form.type.category',
    Class: require('./data/widgets-form-category-data-schema-model')
  },
  formula: {
    labelTranslationKey: 'editor.widgets.widgets-form.type.formula',
    Class: require('./data/widgets-form-formula-data-schema-model'),
    checkIfValid: function (querySchemaModel) {
      return querySchemaModel.columnsCollection.any(function (m) {
        return m.get('type') === 'number';
      });
    }
  },
  histogram: {
    labelTranslationKey: 'editor.widgets.widgets-form.type.histogram',
    Class: require('./data/widgets-form-histogram-data-schema-model'),
    checkIfValid: function (querySchemaModel) {
      return querySchemaModel.columnsCollection.any(function (m) {
        return m.get('type') === 'number';
      });
    }
  },
  'time-series': {
    labelTranslationKey: 'editor.widgets.widgets-form.type.time_series',
    Class: require('./data/widgets-form-time-series-data-schema-model'),
    checkIfValid: function (querySchemaModel) {
      return querySchemaModel.columnsCollection.any(function (m) {
        return m.get('type') === 'date';
      });
    }
  }
};

var styleMap = {
  category: {
    Class: require('./style/widgets-form-style-schema-model')
  },
  formula: {
    Class: require('./style/widgets-form-formula-style-schema-model')
  },
  histogram: {
    Class: require('./style/widgets-form-style-schema-model')
  },
  'time-series': {
    Class: require('./style/widgets-form-style-schema-model')
  }
};

module.exports = {

  createWidgetFormDataModel: function (widgetDefinitionModel, querySchemaModel) {
    var widgetType = widgetDefinitionModel.get('type');
    var Klass = dataMap[widgetType].Class;
    return new Klass(widgetDefinitionModel.attributes, {
      parse: true, // in case the raw attributes needs to be adapted to the expected form types, e.g. timestamp => Date
      widgetDefinitionModel: widgetDefinitionModel,
      columnOptionsFactory: new WidgetsFormColumnOptionsFactory(querySchemaModel)
    });
  },

  createWidgetFormStyleModel: function (widgetDefinitionModel) {
    var widgetType = widgetDefinitionModel.get('type');
    var Klass = styleMap[widgetType].Class;
    return new Klass(widgetDefinitionModel.attributes, { parse: true });
  },

  getDataTypes: function (querySchemaModel) {
    return _.reduce(dataMap, function (memo, val, key) {
      if (val.checkIfValid ? val.checkIfValid(querySchemaModel) : true) {
        memo.push({
          value: key,
          label: _t(val.labelTranslationKey)
        });
      }
      return memo;
    }, []);
  }

};
