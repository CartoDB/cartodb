var _ = require('underscore');
var WidgetsFormColumnOptionsFactory = require('./widgets-form-column-options-factory');

var dataMap = {
  category: {
    labelTranslationKey: 'editor.widgets.widgets-form.type.category',
    iconTemplate: require('builder/editor/widgets/widget-icon-category.tpl'),
    Class: require('./schema/widgets-form-category-schema-model')
  },
  formula: {
    labelTranslationKey: 'editor.widgets.widgets-form.type.formula',
    iconTemplate: require('builder/editor/widgets/widget-icon-formula.tpl'),
    Class: require('./schema/widgets-form-formula-schema-model'),
    checkIfValid: function (querySchemaModel) {
      return querySchemaModel.columnsCollection.any(function (m) {
        return m.get('type') === 'number';
      });
    }
  },
  histogram: {
    labelTranslationKey: 'editor.widgets.widgets-form.type.histogram',
    iconTemplate: require('builder/editor/widgets/widget-icon-histogram.tpl'),
    Class: require('./schema/widgets-form-histogram-schema-model'),
    checkIfValid: function (querySchemaModel) {
      return querySchemaModel.columnsCollection.any(function (m) {
        return m.get('type') === 'number';
      });
    }
  },
  'time-series': {
    labelTranslationKey: 'editor.widgets.widgets-form.type.time_series',
    iconTemplate: require('builder/editor/widgets/widget-icon-timeSeries.tpl'),
    Class: require('./schema/widgets-form-time-series-schema-model'),
    checkIfValid: function (querySchemaModel) {
      return querySchemaModel.columnsCollection.any(function (m) {
        return m.get('type') === 'date' || m.get('type') === 'number';
      });
    }
  }
};

module.exports = {

  createWidgetFormModel: function (options) {
    var widgetDefinitionModel = options.widgetDefinitionModel;
    var widgetType = widgetDefinitionModel.get('type');
    var Klass = dataMap[widgetType].Class;
    return new Klass(widgetDefinitionModel.attributes, {
      parse: true, // in case the raw attributes needs to be adapted to the expected form types, e.g. timestamp => Date
      columnOptionsFactory: new WidgetsFormColumnOptionsFactory(options.querySchemaModel),
      userModel: options.userModel,
      modals: options.modals,
      configModel: options.configModel,
      querySchemaModel: options.querySchemaModel
    });
  },

  getDataTypes: function (querySchemaModel) {
    return _.reduce(dataMap, function (memo, val, key) {
      if (val.checkIfValid ? val.checkIfValid(querySchemaModel) : true) {
        memo.push({
          iconTemplate: val.iconTemplate,
          value: key,
          label: _t(val.labelTranslationKey)
        });
      }
      return memo;
    }, []);
  }

};
