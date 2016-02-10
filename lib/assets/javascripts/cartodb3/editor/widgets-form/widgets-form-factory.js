var map = {
  data: {
    category: require('./schemas/data/widgets-form-category-data-schema-model'),
    formula: require('./schemas/data/widgets-form-formula-data-schema-model'),
    histogram: require('./schemas/data/widgets-form-histogram-data-schema-model'),
    'time-series': require('./schemas/data/widgets-form-time-series-data-schema-model')
  },
  style: {
    category: require('./schemas/style/widgets-form-category-style-schema-model'),
    formula: require('./schemas/style/widgets-form-formula-style-schema-model'),
    histogram: require('./schemas/style/widgets-form-histogram-style-schema-model'),
    'time-series': require('./schemas/style/widgets-form-time-series-style-schema-model')
  }
};

module.exports = {

  createWidgetFormModel: function (formType, widgetDefinitionModel, layerDefinitionsCollection) {
    var widgetType = widgetDefinitionModel.get('type');
    var Klass = map[formType][widgetType];
    return new Klass({}, {
      widgetDefinitionModel: widgetDefinitionModel,
      layerDefinitionsCollection: layerDefinitionsCollection
    });
  }
};
