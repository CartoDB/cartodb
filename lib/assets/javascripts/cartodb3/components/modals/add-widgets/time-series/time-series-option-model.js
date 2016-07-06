var _ = require('underscore');
var WidgetOptionModel = require('../widget-option-model');
var Notifier = require('../../../../components/notifier/notifier');
var errorParser = require('../../../../helpers/error-parser');

module.exports = WidgetOptionModel.extend({

  defaults: _.defaults({type: 'time-series'}, WidgetOptionModel.defaults),

  save: function (widgetDefinitionsCollection) {
    var columnName = this.columnName();
    var layerId = this.layerDefinitionModel().id;

    var attrs = {
      type: 'time-series',
      layer_id: layerId,
      source: {
        id: this.analysisDefinitionNodeModel().id
      },
      options: {
        column: columnName,
        title: this.get('title'),
        bins: this.get('bins')
      }
    };

    var notification;

    var successHandler = function (mdl, attrs) {
      notification.set({
        status: 'success',
        info: _t('editor.widgets.notifier.success', {
          column: columnName,
          type: 'time-series'
        }),
        closable: true
      });
    };

    var errorHandler = function (mdl, e) {
      notification.set({
        status: 'error',
        info: _t('editor.widgets.notifier.error', {
          column: columnName,
          type: 'time-series',
          error: errorParser(e)
        }),
        closable: true
      });
    };

    var createNotification = function (type) {
      var info = type === 'create'
                ? _t('editor.widgets.notifier.loading', {
                  column: columnName,
                  type: 'time-series'
                })
                : _t('editor.widgets.notifier.update', {
                  column: columnName,
                  type: 'time-series'
                });

      notification = Notifier.addNotification({
        status: 'loading',
        info: info,
        closable: false
      });
    };

    var m = widgetDefinitionsCollection.find(this._isTimesSeries);
    if (m) {
      // Update existing widget, but only if the column or layer differs
      if (m.get('column') !== columnName || m.get('layer_id') !== layerId) {
        createNotification('update');
        m.save(attrs, {
          wait: true,
          success: successHandler,
          error: errorHandler
        });
      }
    } else {
      createNotification('create');
      widgetDefinitionsCollection.create(attrs, {
        wait: true,
        success: successHandler,
        error: errorHandler
      });
    }
  },

  _isTimesSeries: function (m) {
    return m.get('type') === 'time-series';
  }
});
