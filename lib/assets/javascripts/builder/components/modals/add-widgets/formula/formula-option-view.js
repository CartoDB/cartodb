var CoreView = require('backbone/core-view');
var LayerSelectorView = require('builder/components/modals/add-widgets/layer-selector-view');
var template = require('./formula-option.tpl');
var formulaFake = require('./formula-fake.tpl');
var _ = require('underscore');

/**
 * View for an individual formula option.
 */
module.exports = CoreView.extend({

  events: {
    'click': '_onSelect'
  },

  initialize: function (opts) {
    this.listenTo(this.model, 'change:layer_index', this.render);
    this.listenTo(this.model, 'change:selected', this.render);
    this.aggregation = this.model.get('operation');
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
      columnName: this.model.get('title'),
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
          var stats = self.$('.js-formulastats').children();
          var aggregation = graph[{ // eslint-disable-line
            'avg': 'getAverage',
            'sum': 'getSum',
            'min': 'getMin',
            'max': 'getMax',
            'count': 'getCount'
          }[self.aggregation]]();
          if (_.isNumber(aggregation)) {
            self.$(stats[0]).text(graph.getNullsPercentage() + '% null');
            if (self.aggregation === 'count') {
              self.$(stats[1]).text(aggregation.toFixed().toString());
            } else {
              self.$(stats[1]).text(aggregation.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
            }
            self.$('.js-formulastats').show();
          } else {
            self.$('.js-formulastats').append(formulaFake());
            self.$('.js-formulastats').show();
          }
        } else {
          self.$('.js-formulastats').append(formulaFake());
          self.$('.js-formulastats').show();
        }
      }
    );
  }

});
