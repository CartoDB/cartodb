var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, options) {
    this.widgetDefinitionModel = options.widgetDefinitionModel;
    this._setAttributes();
    this._generateSchema();
  },

  _setAttributes: function () {
    var m = this.widgetDefinitionModel;
    var o = m.get('options');
    this.set({
      layer_id: m.get('layer_id'),
      title: m.get('title'),
      column: o.column,
      bins: o.bins,
      start: o.start,
      end: o.end
    });
  },

  updateDefinitionModel: function () {
    this.widgetDefinitionModel.set({
      layer_id: this.get('layer_id'),
      title: this.get('title'),
      options: {
        column: this.get('column'),
        bins: this.get('bins'),
        start: this.get('start'),
        end: this.get('end')
      }
    });
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
        options: [].concat(this.get('column'))
      },
      bins: {
        label: 'Buckets',
        type: 'Number'
      },
      start: {
        type: 'Date'
      },
      end: {
        type: 'Date'
      }
    };
  }

});
