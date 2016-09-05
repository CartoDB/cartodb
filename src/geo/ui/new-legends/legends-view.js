var _ = require('underscore');
var Backbone = require('backbone');
var CategoryLegendView = require('./category-legend-view');
var BubbleLegendView = require('./bubble-legend-view');

var LegendsView = Backbone.View.extend({

  className: 'CDB-Legends',

  initialize: function (legends) {
    this._legends = legends;
  },

  render: function () {
    _.each(this._legends, this._renderLegend, this);
    return this;
  },

  _renderLegend: function (legendModel) {
    var legendView = this._createLegendView(legendModel);
    this.$el.append(legendView.render().$el);
  },

  _createLegendView: function (legendModel) {
    // TODO: Factory?
    if (legendModel.get('type') === 'bubble') {
      return new BubbleLegendView({ model: legendModel });
    }
    if (legendModel.get('type') === 'category') {
      return new CategoryLegendView({ model: legendModel });
    }

    alert('legend type "' + legendModel.get('type') + '" is not supported yet');
  }
});

module.exports = LegendsView;
