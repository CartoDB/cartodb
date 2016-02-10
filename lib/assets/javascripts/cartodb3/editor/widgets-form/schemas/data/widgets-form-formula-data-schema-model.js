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
      operation: {
        type: 'Select',
        options: ['min', 'max', 'count', 'avg']
      },
      suffix: {
        type: 'Text'
      },
      prefix: {
        type: 'Text'
      }
    };
  },

  updateDefinitionModel: function () {
    this.widgetDefinitionModel.save({
      layer_id: this.get('layer_id'),
      title: this.get('title'),
      options: {
        column: this.get('column'),
        operation: this.get('operation'),
        suffix: this.get('suffix'),
        prefix: this.get('prefix')
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
      operation: o.operation,
      suffix: o.suffix,
      prefix: o.prefix
    });
  }

});
