var cdb = require('cartodb.js');

module.exports = cdb.core.Model.extend({
  initialize: function (attrs, options) {
    this.widgetDefinitionModel = options.widgetDefinitionModel;
    this._setAttributes();
    this._generateSchema();
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
        options: [].concat({ value: this.get('layer_id'), label: 'layer_name?' })
      },
      column: {
        type: 'Select',
        label: 'Value',
        options: [].concat(this.get('column'))
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
  }

});
