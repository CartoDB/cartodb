var _ = require('underscore');
var cdb = require('cartodb.js');
var template = require('./add-widgets-select-layer.tpl');

/**
 * View to select a layer, to know for what layer (and implicitly data) to render widget options for.
 */
module.exports = cdb.core.View.extend({

  tagName: 'select',

  events: {
    'change': '_onChange'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModels) throw new Error('layerDefinitionModels is required');

    this.layerDefinitionModels = opts.layerDefinitionModels;
  },

  render: function () {
    this.$el.html('');
    _.each(this.layerDefinitionModels, this._renderOption, this);
    return this;
  },

  _renderOption: function (m) {
    this.$el.append(
      template({
        value: m.id,
        isSelected: m.id === this.model.get('layer_id'),
        name: m.getName()
      }));
  },

  _onChange: function () {
    this.model.set('layer_id', this._selectedValue());
  },

  _selectedValue: function () {
    return this.$el.val();
  }
});
