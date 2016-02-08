var cdb = require('cartodb.js');
var WidgetFormSchemaModel = require('./widget-form-schema-model');

module.exports = WidgetFormSchemaModel.extend({

  schema: {
    syncData: {
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
    syncBoundingBox: {
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
  },

  initialize: function () {
    this.bind('change:layer_id', this._onLayerIdChange, this);
  },

  _onLayerIdChange: function () {
    this.schema.column.options = ['dummy']; // TODO: update column schema
    this.trigger('update', this);
  }

});
