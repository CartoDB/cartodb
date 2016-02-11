var _ = require('underscore');

var dataMap = {
  category: {
    labelTranslationKey: 'editor.widgets.type.category',
    klass: require('./data/widgets-form-category-data-schema-model')
  },
  formula: {
    labelTranslationKey: 'editor.widgets.type.formula',
    klass: require('./data/widgets-form-formula-data-schema-model'),
    checkIfValid: function (tableModel) {
      return tableModel.columnsCollection.any(function (m) {
        console.log(1, m.get('type'));
        return m.get('type') === 'number';
      });
    }
  },
  histogram: {
    labelTranslationKey: 'editor.widgets.type.histogram',
    klass: require('./data/widgets-form-histogram-data-schema-model')
  },
  'time-series': {
    labelTranslationKey: 'editor.widgets.type.time_series',
    klass: require('./data/widgets-form-time-series-data-schema-model'),
    checkIfValid: function (tableModel) {
      return tableModel.columnsCollection.any(function (m) {
        return m.get('type') === 'date';
      });
    }
  }
};

var styleMap = {
  category: require('./style/widgets-form-category-style-schema-model'),
  formula: require('./style/widgets-form-formula-style-schema-model'),
  histogram: require('./style/widgets-form-histogram-style-schema-model'),
  'time-series': require('./style/widgets-form-time-series-style-schema-model')
};

module.exports = {

  createWidgetFormDataModel: function (widgetDefinitionModel, tableModel) {
    var widgetType = widgetDefinitionModel.get('type');
    var Klass = dataMap[widgetType].klass;
    return new Klass({}, {
      widgetDefinitionModel: widgetDefinitionModel,
      tableModel: tableModel
    });
  },

  createWidgetFormStyleModel: function (widgetDefinitionModel) {
    var widgetType = widgetDefinitionModel.get('type');
    var Klass = styleMap[widgetType];
    return new Klass({}, {
      widgetDefinitionModel: widgetDefinitionModel
    });
  },

  getDataTypes: function (tableModel) {
    return _.reduce(dataMap, function (memo, val, key) {
      if (val.checkIfValid ? val.checkIfValid(tableModel) : true) {
        memo.push({
          value: key,
          label: _t(val.labelTranslationKey)
        });
      }
      return memo;
    }, []);
  }

};
