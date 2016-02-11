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
        label: 'Unfiltered',
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
        label: 'Dynamic',
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
