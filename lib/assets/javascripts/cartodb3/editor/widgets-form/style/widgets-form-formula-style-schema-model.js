var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, options) {
    this._widgetDefinitionModel = options.widgetDefinitionModel;
    this._setAttributes();
  },

  updateSchema: function () {
    this.schema = {
      sync_on_data_change: {
        type: 'Radio',
        label: _t('editor.widgets.style.unfiltered'),
        options: [
          {
            val: true,
            label: 'yes'
          }, {
            val: false,
            label: 'no'
          }
        ]
      },
      sync_on_bbox_change: {
        type: 'Radio',
        label: _t('editor.widgets.style.dynamic'),
        options: [
          {
            val: true,
            label: 'yes'
          }, {
            val: false,
            label: 'no'
          }
        ]
      }
    };
  },

  updateDefinitionModel: function () {
    this._widgetDefinitionModel.update({
      sync_on_data_change: !!this.get('sync_on_data_change'),
      sync_on_bbox_change: !!this.get('sync_on_bbox_change')
    });
  },

  _setAttributes: function () {
    var m = this._widgetDefinitionModel;
    this.set({
      sync_on_data_change: m.get('sync_on_data_change'),
      sync_on_bbox_change: m.get('sync_on_bbox_change')
    });
  }

});
