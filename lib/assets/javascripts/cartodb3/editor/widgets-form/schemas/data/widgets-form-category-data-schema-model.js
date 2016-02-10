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
    this.widgetDefinitionModel.set({
      layer_id: this.get('layer_id'),
      title: this.get('title'),
      options: {
        column: this.get('column'),
        aggregation: this.get('aggregation'),
        aggregation_column: this.get('aggregation_column'),
        suffix: this.get('suffix'),
        prefix: this.get('prefix')
      }
    });
    this.widgetDefinitionModel.widgetModel.update(this.attributes);

    // TODO this should handled internally by the dataview; temporary hack to get things working for now
    var layerId = this.get('layer_id');
    var layerDefModel = this._layerDefinitionsCollection.get(layerId);
    var layerModel = layerDefModel.layerModel;
    this.widgetDefinitionModel.widgetModel.dataviewModel.layer = layerModel;

    this.widgetDefinitionModel.save();
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
    var layerDefModel = this._layerDefinitionsCollection.get(this.get('layer_id'));
    var tableModel = layerDefModel.getTableModel();

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
        success: this.updateSchema.bind(this)
      });
      return [{
        label: 'loading…',
        disabled: true
      }];
    }
  },

  _onChangeLayerId: function () {
    this.set('column', null);
    this.updateSchema();
  }

});
