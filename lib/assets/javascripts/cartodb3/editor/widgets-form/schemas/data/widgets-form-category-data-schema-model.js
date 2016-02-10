var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    schema: {}
  },

  initialize: function (attrs, opts) {
    if (!opts.widgetDefinitionModel) throw new Error('layerDefinitionsCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    this.widgetDefinitionModel = opts.widgetDefinitionModel;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;

    this._setAttributes();
    this.on('change:layer_id', this._onChangeLayerId, this);
  },

  updateSchema: function () {
    var layers = this._layers();
    var columns = this._columnsForSelectedLayer();

    this.schema = {
      title: {
        type: 'Text',
        validators: ['required']
      },
      layer_id: {
        type: 'Select',
        label: 'Source layer',
        options: layers
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
    var layerId = this.get('layer_id');
    var column = this.get('column');
    var aggregationColumn = this.get('aggregation_column');
    var layerDefModel = this._layerDefinitionsCollection.get(layerId);

    // Columns might not be available until table is fetched
    if (column && aggregationColumn) {
      var attrs = {
        layer_id: layerId,
        title: this.get('title'),
        options: {
          column: column,
          aggregation_column: aggregationColumn,
          aggregation: this.get('aggregation'),
          suffix: this.get('suffix'),
          prefix: this.get('prefix')
        }
      };
      this.widgetDefinitionModel.update(layerDefModel, attrs);
    }
  },

  _setAttributes: function () {
    var m = this.widgetDefinitionModel;
    var o = m.get('options');
    this.set({
      layer_id: m.get('layer_id'),
      title: m.get('title'),
      column: o.column,
      aggregation: o.aggregation,
      aggregation_column: o.aggregation_column,
      suffix: o.suffix,
      prefix: o.prefix
    });
  },

  _layers: function () {
    return this._layerDefinitionsCollection
      .chain()
      .filter(function (m) {
        return m.getTableModel();
      })
      .map(function (m) {
        return {
          val: m.id,
          label: m.get('options').table_name
        };
      })
      .value();
  },

  _columnsForSelectedLayer: function () {
    var tableModel = this._tableModel();
    if (tableModel.get('complete')) {
      return tableModel
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
      tableModel.fetch({
        success: this._updateColumnsFromTable.bind(this)
      });
      return [{
        label: 'loading…',
        disabled: true
      }];
    }
  },

  _onChangeLayerId: function () {
    var tableModel = this._tableModel();
    if (tableModel.get('complete')) {
      this._updateColumnsFromTable();
    } else {
      this.set({
        column: null,
        aggregation_column: null
      });
      tableModel.fetch({
        success: this._updateColumnsFromTable.bind(this)
      });
    }
  },

  _updateColumnsFromTable: function () {
    var tableModel = this._tableModel();
    var columnName = tableModel.columnsCollection.first().get('name');
    this.set({
      column: columnName,
      aggregation_column: columnName
    });
    this.updateSchema();
  },

  _tableModel: function () {
    var layerDefModel = this._layerDefinitionsCollection.get(this.get('layer_id'));
    return layerDefModel.getTableModel();
  }

});
