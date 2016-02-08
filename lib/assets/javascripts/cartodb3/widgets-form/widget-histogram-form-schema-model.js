var WidgetFormSchemaModel = require('./widget-form-schema-model');

module.exports = WidgetFormSchemaModel.extend({

  schema: {
    type: {
      type: 'Select',
      options: ['histogram', 'category', 'formula', 'time-series']
    },
    layer_id: {
      type: 'Select',
      label: 'Source layer',
      options: [1, 2]
    },
    column: {
      type: 'Select',
      options: []
    },
    title: {
      type: 'Text',
      validators: ['required']
    },
    sync: {
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
    },
    bins: {
      label: 'Buckets',
      type: 'Number'
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
