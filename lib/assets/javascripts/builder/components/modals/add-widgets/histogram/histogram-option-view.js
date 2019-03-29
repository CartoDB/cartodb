var CoreView = require('backbone/core-view');
var LayerSelectorView = require('builder/components/modals/add-widgets/layer-selector-view');
var template = require('./histogram-option.tpl');
var histogramFake = require('./histogram-fake.tpl');

/**
 * View for an individual histogram option.
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
        if (graph.stats) {
          self.$('.js-Histogram').append(graph.getHistogram({
            color: '#9DE0AD',
            width: 240,
            height: 20,
            bins: 20
          }));
          var stats = self.$('.js-histstats').children();
          self.$(stats[0]).text(graph.getNullsPercentage() + '% null');
          self.$('.js-histstats').css('display', 'flex');
        } else {
          self.$('.js-Histogram').append(histogramFake());
        }
      }
    );
  }

});
