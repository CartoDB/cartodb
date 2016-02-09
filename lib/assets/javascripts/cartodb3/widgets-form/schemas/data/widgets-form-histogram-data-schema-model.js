var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  initialize: function () {
    this.bind('change:layer_id', this._onLayerIdChange, this);
    this._generateSchema();
  },

  _onLayerIdChange: function () {
    this.schema.column.options = ['dummy']; // TODO: update column schema
    this.trigger('update', this);
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
        options: [].concat(this.get('layer_id'))
      },
      column: {
        type: 'Select',
        options: []
      },
      bins: {
        label: 'Buckets',
        type: 'Number'
      }
    };
  }

});
