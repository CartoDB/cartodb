var CoreView = require('backbone/core-view');
var LayerSelectorView = require('../layer-selector-view');
var template = require('./histogram-option.tpl');

/**
 * View for an individual histogram option.
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
    var self = this;
    this.clearSubViews();
    this.$el.html(this._html());
    this._renderLayerSelector();
    this.options.model.stats.graphFor(
      this.model.get('tuples')[0].analysisDefinitionModel.get('table_name'), 
      this.model.get('name'), function (graph) {
        if (graph.stats) {
          self.$('#Histogram').append(graph.getHistogram({
            color:'#9DE0AD',
            width: 240,
            height: 20,
            bins: 20
          }));
          var stats = self.$('#histstats').children();
          self.$(stats[0]).text(graph.getNullsPercentage() + '% null');
          self.$('#histstats').show();
        }
      }
    );
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
