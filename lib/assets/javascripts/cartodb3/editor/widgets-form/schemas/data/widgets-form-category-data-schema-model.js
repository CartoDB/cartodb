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
      aggregation: {
        type: 'Select',
        options: ['sum', 'count']
      },
      aggregation_column: {
        type: 'Select',
        options: columns,
        editorAttrs: {
          disabled: columns[0].disabled
        }
      },
      suffix: {
        type: 'Text'
      },
      prefix: {
        type: 'Text'
      }
    };
    this.trigger('changeSchema');
  },

  updateDefinitionModel: function () {
    var column = this.get('column');
    var aggregationColumn = this.get('aggregation_column');

    // Columns might not be available until table is fetched
    if (column && aggregationColumn) {
      this.widgetDefinitionModel.update({
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
    var m = this.widgetDefinitionModel;
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
    if (this._tableModel.get('complete')) {
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
      // Missing columns, fetch the table data and show a unselectable loading indicator for the time being
      this._tableModel.fetch({
        success: this._updateColumnsFromTable.bind(this)
      });
      return [{
        label: 'loading…',
        disabled: true
      }];
    }
  },

  _updateColumnsFromTable: function () {
    var columnName = this._tableModel.columnsCollection.first().get('name');
    this.set({
      column: columnName,
      aggregation_column: columnName
    });
    this.updateSchema();
  }

});
