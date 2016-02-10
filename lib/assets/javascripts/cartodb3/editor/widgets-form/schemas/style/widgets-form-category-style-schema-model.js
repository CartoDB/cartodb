var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, options) {
    this.widgetDefinitionModel = options.widgetDefinitionModel;
    this._setAttributes();
    this._generateSchema();
  },

  _setAttributes: function () {
    var m = this.widgetDefinitionModel;
    this.set({
      sync_on_data_change: m.get('sync_on_data_change'),
      sync_on_bbox_change: m.get('sync_on_bbox_change')
    });
  },

  updateDefinitionModel: function () {
    this.widgetDefinitionModel.set({
      sync_on_data_change: this.get('sync_on_data_change'),
      sync_on_bbox_change: this.get('sync_on_bbox_change')
    });
    this.widgetDefinitionModel.widgetModel.update(this.attributes);
  },

  _generateSchema: function () {
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
  }

});
