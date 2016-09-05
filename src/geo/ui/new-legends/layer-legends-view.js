var _ = require('underscore');
var Backbone = require('backbone');
var CategoryLegendView = require('./category-legend-view');
var BubbleLegendView = require('./bubble-legend-view');
var template = require('./layer-legends-template.tpl');

var LayerLegendsView = Backbone.View.extend({

  className: 'CDB-LayerLegends',

  events: {
    'click .js-toggle-layer': '_toggleLayer'
  },

  initialize: function () {
    // TODO: When the visibility of a layer changes -> update the checkbox
  },

  render: function () {
    // TODO: If !this.model.isVisible() -> Display layer legends as "disabled"
    this.$el.html(
      template({
        layerName: this.model.getName(),
        isLayerVisible: this.model.isVisible()
      })
    );

    this._renderLegends();
    return this;
  },

  _renderLegends: function () {
    _.each(this.model.getLegends(), this._renderLegend, this);
  },

  _renderLegend: function (legendModel) {
    var legendView = this._createLegendView(legendModel);
    this.$el.append(legendView.render().$el);
  },

  _createLegendView: function (legendModel) {
    if (legendModel.get('type') === 'bubble') {
      return new BubbleLegendView({ model: legendModel });
    }
    if (legendModel.get('type') === 'category') {
      return new CategoryLegendView({ model: legendModel });
    }

    throw new Error("Unsupported legend type: '" + legendModel.get('type') + "'");
  },

  _toggleLayer: function (event) {
    var isLayerEnabled = event.target.checked;
    if (isLayerEnabled) {
      this.model.show();
    } else {
      this.model.hide();
    }
  }
});

module.exports = LayerLegendsView;
