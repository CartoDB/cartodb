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
        text: _t('editor.widgets.widgets-form.data.title'),
        validators: ['required']
      },
      column: {
        type: 'Select',
        title: _t('editor.widgets.widgets-form.data.value'),
        options: columns,
        editorAttrs: {
          disabled: columns[0].disabled
        }
      },
      aggregation: {
        type: 'Select',
        title: _t('editor.widgets.widgets-form.data.aggregation'),
        options: ['sum', 'count']
      },
      aggregation_column: {
        type: 'Select',
        title: _t('editor.widgets.widgets-form.data.aggregation_column'),
        options: columns,
        editorAttrs: {
          disabled: columns[0].disabled
        }
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
    var column = this.get('column');
    var aggregationColumn = this.get('aggregation_column');

    // Columns might not be available until table is fetched
    return !!(column && aggregationColumn);
  },

  _columnsForSelectedLayer: function () {
    if (this._layerTableModel.get('fetched')) {
      return this._layerTableModel
        .columnsCollection
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
  }

});
