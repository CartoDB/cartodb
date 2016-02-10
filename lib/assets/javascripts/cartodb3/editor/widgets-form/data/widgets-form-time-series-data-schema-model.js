var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.widgetDefinitionModel) throw new Error('layerDefinitionsCollection is required');
    if (!opts.tableModel) throw new Error('tableModel is required');
    this.widgetDefinitionModel = opts.widgetDefinitionModel;
    this._tableModel = opts.tableModel;

    this._setAttributes();
  },

  updateSchema: function () {
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
    this.widgetDefinitionModel.widgetModel.update(this.attributes);
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
  }

});
