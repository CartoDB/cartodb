var cdb = require('cartodb-deep-insights.js');

module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');

    this._layerTableModel = opts.layerTableModel;
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
        title: _t('editor.widgets.data.column'),
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

  canSave: function () {
    return this.get('column');
  },

  _columnsForSelectedLayer: function () {
    if (this._layerTableModel.get('fetched')) {
      return this._layerTableModel
        .columnsCollection
        .filter(this._isDateType)
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

  _isDateType: function (m) {
    return m.get('type') === 'date';
  }

});
