var cdb = require('cartodb.js');
var WidgetFormSchemaModel = require('../widgets-form-schema-model');

module.exports = WidgetFormSchemaModel.extend({

  initialize: function () {
    this.bind('change:layer_id', this._onLayerIdChange, this);
    this._generateSchema();
  },

  _onLayerIdChange: function () {
    // this.schema.column.options = ['dummy']; // TODO: update column schema
    // this.trigger('changeSchema', this);
  },

  _generateSchema: function () {
    this.schema = {
      title: {
        type: 'Text',
        validators: ['required']
      },
      layer_id: {
        type: 'Select',
        label: 'Source layer',
        options: [].concat({ value: this.get('layer_id'), label: 'layer_name?' })
      },
      column: {
        type: 'Select',
        label: 'Value',
        options: [].concat(this.get('column'))
      },
      aggregation: {
        type: 'Select',
        options: ['sum', 'count']
      },
      aggregationColumn: {
        type: 'Select',
        options: [].concat(this.get('aggregationColumn') || this.get('column'))
      },
      suffix: {
        type: 'Text'
      },
      prefix: {
        type: 'Text'
      }
    };
  }

});
