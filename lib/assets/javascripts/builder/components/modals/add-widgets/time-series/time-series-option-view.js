var CoreView = require('backbone/core-view');
var LayerSelectorView = require('builder/components/modals/add-widgets/layer-selector-view');
var template = require('./time-series-option.tpl');

/**
 * View for an individual time-series option.
 */
module.exports = CoreView.extend({

  events: {
    'click': '_onSelect'
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
    var isSelected = !!this.model.get('selected');

    this.$el.toggleClass('is-selected', isSelected);

    return template({
      columnName: this.model.columnName(),
      isSelected: isSelected
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
