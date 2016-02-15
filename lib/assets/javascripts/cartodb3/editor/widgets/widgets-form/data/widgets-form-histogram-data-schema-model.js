var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    schema: {}
  },

  initialize: function (attrs, opts) {
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    if (!opts.tableModel) throw new Error('tableModel is required');
    this._widgetDefinitionModel = opts.widgetDefinitionModel;
    this._tableModel = opts.tableModel;

    this._setAttributes();
  },

  updateSchema: function () {
    var columns = this._columnsForSelectedLayer();

    this.schema = {
      title: {
        title: _t('editor.widgets.data.title'),
        type: 'Text',
        validators: ['required']
      },
      column: {
        tile: _t('editor.widgets.data.column'),
        type: 'Select',
        options: columns,
        editorAttrs: {
          disabled: columns[0].disabled
        }
      },
      bins: {
        title: _t('editor.widgets.data.bins'),
        type: 'Number'
      }
    };
  },

  updateDefinitionModel: function () {
    var column = this.get('column');

    // Columns might not be available until table is fetched
    if (column) {
      this._widgetDefinitionModel.update({
        layer_id: this.get('layer_id'),
        title: this.get('title'),
        options: {
          column: column,
          bins: this.get('bins')
        }
      });
    }
  },

  _setAttributes: function () {
    var m = this._widgetDefinitionModel;
    var o = m.get('options');
    this.set({
      layer_id: m.get('layer_id'),
      title: m.get('title'),
      column: o.column,
      bins: o.bins
    });
  },

  _columnsForSelectedLayer: function () {
    if (this._tableModel.get('fetched')) {
      return this._tableModel
        .columnsCollection
        .filter(this._isNumberType)
        .map(function (m) {
          var columnName = m.get('name');
          return {
            val: m.id,
            label: columnName
          };
        });
    } else {
      return [{
        label: _t('editor.widgets.data.loading'),
        disabled: true
      }];
    }
  },

  _isNumberType: function (m) {
    return m.get('type') === 'number';
  }

});
