var _ = require('underscore');
var cdb = require('cartodb.js');
var template = require('./time-series-option.tpl');

/**
 * View for an individual time-series option.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-radio': '_onSelect',
    'change .js-layers': '_onLayerIndexChange'
  },

  initialize: function (opts) {
    this.listenTo(this.model, 'change:layer_index', this.render);
    this.listenTo(this.model, 'change:selected', this.render);
  },

  render: function () {
    this.$el.html(this._html());
    return this;
  },

  _html: function () {
    var i = this.model.get('layer_index') || 0;
    var tuples = this.model.get('tuples');

    return template({
      layerIndex: i,
      columnName: tuples[i].columnModel.get('name'),
      layerNames: _.map(tuples, function (item) {
        return item.layerDefinitionModel.getName();
      }),
      isSelected: !!this.model.get('selected')
    });
  },

  _onLayerIndexChange: function (ev) {
    var val = this.$('.js-layers').val();
    this.model.set('layer_index', parseInt(val, 10));
  },

  _onSelect: function () {
    this.model.set('selected', !this.model.get('selected'));
  }

});
