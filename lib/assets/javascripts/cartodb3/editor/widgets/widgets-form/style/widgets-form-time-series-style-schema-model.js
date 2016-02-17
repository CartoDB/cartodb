var cdb = require('cartodb-deep-insights.js');

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, options) {
    this._widgetDefinitionModel = options.widgetDefinitionModel;
    this._setAttributes();
  },

  updateSchema: function () {
    var o = [
      {
        val: true,
        label: _t('editor.widgets.style.yes')
      }, {
        val: false,
        label: _t('editor.widgets.style.no')
      }
    ];
    this.schema = {};

    this.schema[_t('editor.widgets.style.sync_on_data_change')] = {
      type: 'Radio',
      options: o
    };

    this.schema[_t('editor.widgets.style.sync_on_bbox_change')] = {
      type: 'Radio',
      options: o
    };
  },

  _setAttributes: function () {
    this._widgetDefinitionModel.update({
      sync_on_data_change: !!this.get('sync_on_data_change'),
      sync_on_bbox_change: !!this.get('sync_on_bbox_change')
    });
  },

  updateDefinitionModel: function () {
    this._widgetDefinitionModel.set({
      sync_on_data_change: this.get('sync_on_data_change'),
      sync_on_bbox_change: this.get('sync_on_bbox_change')
    });
    this._widgetDefinitionModel.widgetModel.update(this.attributes);
  }

});
