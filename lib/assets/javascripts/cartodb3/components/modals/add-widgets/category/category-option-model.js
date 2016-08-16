var _ = require('underscore');
var WidgetOptionModel = require('../widget-option-model');
// var Notifier = require('../../../../components/notifier/notifier');
// var errorParser = require('../../../../helpers/error-parser');

module.exports = WidgetOptionModel.extend({

  defaults: _.defaults({type: 'category'}, WidgetOptionModel.defaults),

  save: function (widgetDefinitionsCollection) {
    var columnName = this.columnName();
    var model = this;
    widgetDefinitionsCollection.trigger('loading', model);
    // var notification = Notifier.addNotification({
    //   status: 'loading',
    //   info: _t('editor.widgets.notifier.loading', {
    //     column: columnName,
    //     type: 'category'
    //   }),
    //   closable: false
    // });

    var attrs = {
      type: 'category',
      layer_id: this.layerDefinitionModel().id,
      source: {
        id: this.analysisDefinitionNodeModel().id
      },
      options: {
        column: columnName,
        aggregation_column: columnName,
        aggregation: this.get('aggregation'),
        title: this.get('title')
      }
    };

    return widgetDefinitionsCollection.create(attrs, {
      wait: true,
      success: function (mdl, attrs) {
        widgetDefinitionsCollection.trigger('success', model);
        // notification.set({
        //   status: 'success',
        //   info: _t('editor.widgets.notifier.success', {
        //     column: columnName,
        //     type: 'category'
        //   }),
        //   closable: true
        // });
      },
      error: function (mdl, e) {
        widgetDefinitionsCollection.trigger('error', model, e);
        // notification.set({
        //   status: 'error',
        //   info: _t('editor.widgets.notifier.error', {
        //     column: columnName,
        //     type: 'category',
        //     error: errorParser(e)
        //   }),
        //   closable: true
        // });
      }
    });
  }
});
