var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    schema: {}
  },

  initialize: function (attrs, opts) {
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');

    this._layerTableModel = opts.layerTableModel;
  },

  updateSchema: function () {
    var columns = this._columnsForSelectedLayer();
    this.schema = {
      title: {
        type: 'Text',
        title: _t('editor.widgets.widgets-form.data.title'),
        validators: ['required']
      },
      column: {
        type: 'Select',
        title: _t('editor.widgets.widgets-form.data.column'),
        options: columns,
        editorAttrs: {
          disabled: columns[0].disabled
        }
      },
      operation: {
        type: 'Select',
        title: _t('editor.widgets.widgets-form.data.operation'),
        options: ['min', 'max', 'count', 'avg', 'sum']
      },
      suffix: {
        title: _t('editor.widgets.widgets-form.data.suffix'),
        type: 'Text'
      },
      prefix: {
        title: _t('editor.widgets.widgets-form.data.prefix'),
        type: 'Text'
      }
    };
  },

  canSave: function () {
    return !!this.get('column');
  },

  _columnsForSelectedLayer: function () {
    if (this._layerTableModel.get('fetched')) {
      return this._layerTableModel
      .columnsCollection
      .filter(this._isNumberType)
      .map(function (m) {
        var columnName = m.get('name');
        return {
          val: columnName,
          label: columnName
        };
      });
    } else {
      return [{
        label: _t('editor.widgets.loading'),
        disabled: true
      }];
    }
  },

  _isNumberType: function (m) {
    return m.get('type') === 'number';
  }

});
