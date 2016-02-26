var cdb = require('cartodb.js');
var LayerSelectorView = require('../layer-selector-view');
var template = require('./histogram-option.tpl');

/**
 * View for an individual histogram option.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-checkbox': '_onSelect'
  },

  initialize: function (opts) {
    this.listenTo(this.model, 'change:layer_index', this.render);
    this.listenTo(this.model, 'change:selected', this.render);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this._html());
    this._renderLayerSelector();
    return this;
  },

  _html: function () {
    var i = this.model.get('layer_index') || 0;
    var tuples = this.model.get('tuples');

    return template({
      columnName: tuples[i].columnModel.get('name'),
      isSelected: !!this.model.get('selected')
    });
  },

  _renderLayerSelector: function () {
    var view = new LayerSelectorView({
      model: this.model
    });
    this.addView(view);
    this.$('.js-inner').append(view.render().el);
  },

  _onSelect: function () {
    this.model.set('selected', !this.model.get('selected'));
  }

});
