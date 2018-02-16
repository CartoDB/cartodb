var CoreView = require('backbone/core-view');
var LayerSelectorView = require('builder/components/modals/add-widgets/layer-selector-view');
var template = require('./category-option.tpl');
var categoryFake = require('./category-fake.tpl');

/**
 * View for an individual category option.
 */
module.exports = CoreView.extend({
  module: 'components/modals/add-widgets/category/category-option-view',

  events: {
    'click': '_onSelect'
  },

  initialize: function (opts) {
    this._initBinds();
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
  },

  _drawGraph: function () {
    var self = this;
    this.options.model.stats.graphFor(
      this.model.analysisDefinitionNodeModel().get('table_name'),
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
          self.$('.js-catstats').css('display', 'flex');
        } else {
          self.$('.js-Category-bar').append(categoryFake());
        }
      }
    );
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:layer_index', this.render);
    this.listenTo(this.model, 'change:selected', this.render);
  }
});
