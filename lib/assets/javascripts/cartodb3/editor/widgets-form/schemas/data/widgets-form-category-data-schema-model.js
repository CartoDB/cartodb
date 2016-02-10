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
    this._generateSchema();

    this.on('change:layer_id', this._onChangeLayerId, this);
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
  },

  _generateSchema: function () {
    this.schema = {
      title: {
        type: 'Text',
        validators: ['required']
      },
      layer_id: {
        type: 'Select',
        label: 'Source layer',
        options: this._layers()
      },
      column: {
        type: 'Select',
        label: 'Value',
        options: this._columnsForSelectedLayer()
      },
      aggregation: {
        type: 'Select',
        options: ['sum', 'count']
      },
      aggregation_column: {
        type: 'Select',
        options: [].concat(this.get('aggregation_column') || this.get('column'))
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

  _layers: function () {
    return this._layerDefinitionsCollection
      .chain()
      .filter(function (m) {
        return m.getTableModel();
      })
      .map(function (m) {
        return {
          val: m.id,
          label: m.get('options').layer_name
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
        success: this._generateSchema.bind(this)
      });
      return [{
        label: 'loading…',
        disabled: 'disabled'
      }];
    }
  },

  _onChangeLayerId: function () {
    this.set('column', null);
    this._generateSchema();
  }

});
