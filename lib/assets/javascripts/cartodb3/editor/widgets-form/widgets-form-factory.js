var dataMap = {
  category: require('./data/widgets-form-category-data-schema-model'),
  formula: require('./data/widgets-form-formula-data-schema-model'),
  histogram: require('./data/widgets-form-histogram-data-schema-model'),
  'time-series': require('./data/widgets-form-time-series-data-schema-model')
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
    var Klass = dataMap[widgetType];
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
};
