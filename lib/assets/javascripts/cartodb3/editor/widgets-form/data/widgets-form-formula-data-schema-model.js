var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    schema: {}
  },

  initialize: function (attrs, opts) {
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    if (!opts.tableModel) throw new Error('tableModel is required');
    this.widgetDefinitionModel = opts.widgetDefinitionModel;
    this._tableModel = opts.tableModel;

    this._setAttributes();
  },

  updateSchema: function () {
    var columns = this._columnsForSelectedLayer();
    this.schema = {
      title: {
        type: 'Text',
        validators: ['required']
      },
      column: {
        type: 'Select',
        label: 'Value',
        options: columns,
        editorAttrs: {
          disabled: columns[0].disabled
        }
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
    var column = this.get('column');

    // Columns might not be available until table is fetched
    if (column) {
      this.widgetDefinitionModel.save({
        title: this.get('title'),
        options: {
          column: column,
          operation: this.get('operation'),
          suffix: this.get('suffix'),
          prefix: this.get('prefix')
        }
      });
    }
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
