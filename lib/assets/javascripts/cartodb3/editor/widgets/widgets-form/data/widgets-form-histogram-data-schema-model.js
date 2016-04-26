var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');

    this._layerTableModel = opts.layerTableModel;
  },

  updateSchema: function () {
    var columns = this._columnsForSelectedLayer();

    this.schema = {
      title: {
        title: _t('editor.widgets.widgets-form.data.title'),
        type: 'Text',
        validators: ['required']
      },
      column: {
        tile: _t('editor.widgets.widgets-form.data.column'),
        type: 'Select',
        options: columns,
        editorAttrs: {
          disabled: columns[0].disabled
        }
      },
      bins: {
        title: _t('editor.widgets.widgets-form.data.bins'),
        type: 'Number',
        validators: ['required', {
          type: 'interval',
          min: 0,
          max: 30
        }]
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
        label: _t('editor.widgets.widgets-form.data.loading'),
        disabled: true
      }];
    }
  },

  _isNumberType: function (m) {
    return m.get('type') === 'number';
  }

});
