var CoreView = require('backbone/core-view');
var LayerSelectorView = require('../layer-selector-view');
var template = require('./category-option.tpl');

/**
 * View for an individual category option.
 */
module.exports = CoreView.extend({

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
    var tableStats = this.options.model.stats;
    if (tableStats) {
      this._drawGraph();
    }
    return this;
  },

  _html: function () {
    var i = this.model.get('layer_index');
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
  },

  _drawGraph: function () {
    var self = this;
    this.options.model.stats.graphFor(
      this.model.get('tuples')[0].analysisDefinitionModel.get('table_name'),
      this.model.get('name'), function (graph) {
        if (graph.stats && graph.stats.freqs) {
          self.$('.js-Category-bar').append(graph.getCategory({
            color: '#9DE0AD',
            width: 240,
            height: 10
          }));
          var stats = self.$('.js-catstats').children();
          self.$(stats[0]).text(graph.getNullsPercentage() + '% null');
          self.$(stats[1]).text((graph.getPercentageInTopCategories() * 100).toFixed(2) + _t('components.modals.add-widgets.percentage-in-top-cats'));
          self.$('.js-catstats').show();
        }
      }
    );
  }

});
