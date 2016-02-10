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
      title: m.get('title'),
      column: o.column,
      operation: o.operation,
      suffix: o.suffix,
      prefix: o.prefix
    });
  },

  _columnsForSelectedLayer: function () {
    if (this._tableModel.get('fetched')) {
      return this._tableModel
        .columnsCollection
        .map(function (m) {
          var columnName = m.get('name');
          return {
            val: m.id,
            label: columnName
          };
        });
    } else {
      return [{
        label: 'loading…',
        disabled: true
      }];
    }
  }

});
