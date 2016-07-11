var _ = require('underscore');
var WidgetOptionModel = require('../widget-option-model');
var Notifier = require('../../../../components/notifier/notifier');
var errorParser = require('../../../../helpers/error-parser');

module.exports = WidgetOptionModel.extend({
  defaults: _.defaults({type: 'histogram'}, WidgetOptionModel.defaults),

  save: function (widgetDefinitionsCollection) {
    var column = this.columnName();
    var attrs = {
      type: 'histogram',
      layer_id: this.layerDefinitionModel().id,
      source: {
        id: this.analysisDefinitionNodeModel().id
      },
      options: {
        column: this.columnName(),
        title: this.get('title'),
        bins: this.get('bins')
      }
    };

    var notification = Notifier.addNotification({
      status: 'loading',
      info: _t('editor.widgets.notifier.loading', {
        column: column,
        type: 'histogram'
      }),
      closable: false
    });

    return widgetDefinitionsCollection.create(attrs, {
      wait: true,
      success: function (mdl, attrs) {
        notification.set({
          status: 'success',
          info: _t('editor.widgets.notifier.success', {
            column: column,
            type: 'histogram'
          }),
          closable: true
        });
      },
      error: function (mdl, e) {
        notification.set({
          status: 'error',
          info: _t('editor.widgets.notifier.error', {
            column: column,
            type: 'histogram',
            error: errorParser(e)
          }),
          closable: true
        });
      }
    });
  }
});
