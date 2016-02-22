var cdb = require('cartodb-deep-insights.js');

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
        type: 'Text',
        text: _t('editor.widgets.data.title'),
        validators: ['required']
      },
      column: {
        type: 'Select',
        title: _t('editor.widgets.data.value'),
        options: columns,
        editorAttrs: {
          disabled: columns[0].disabled
        }
      },
      aggregation: {
        type: 'Select',
        title: _t('editor.widgets.data.aggregation'),
        options: ['sum', 'count']
      },
      aggregation_column: {
        type: 'Select',
        title: _t('editor.widgets.data.aggregation_column'),
        options: columns,
        editorAttrs: {
          disabled: columns[0].disabled
        }
      },
      suffix: {
        title: _t('editor.widgets.data.suffix'),
        type: 'Text'
      },
      prefix: {
        title: _t('editor.widgets.data.prefix'),
        type: 'Text'
      }
    };
  },

  updateDefinitionModel: function () {
    var column = this.get('column');
    var aggregationColumn = this.get('aggregation_column');

    // Columns might not be available until table is fetched
    if (column && aggregationColumn) {
      this._widgetDefinitionModel.update({
        title: this.get('title'),
        options: {
          column: column,
          aggregation_column: aggregationColumn,
          aggregation: this.get('aggregation'),
          suffix: this.get('suffix'),
          prefix: this.get('prefix')
        }
      });
    }
  },

  _setAttributes: function () {
    var m = this._widgetDefinitionModel;
    var o = m.get('options');
    this.set({
      title: m.get('title'),
      column: o.column,
      aggregation: o.aggregation,
      aggregation_column: o.aggregation_column,
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
        label: _t('editor.widgets.data.loading'),
        disabled: true
      }];
    }
  }

});
