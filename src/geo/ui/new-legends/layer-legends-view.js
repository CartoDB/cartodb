var _ = require('underscore');
var Backbone = require('backbone');
var CategoryLegendView = require('./category-legend-view');
var BubbleLegendView = require('./bubble-legend-view');
var template = require('./layer-legends-template.tpl');

var LayerLegendsView = Backbone.View.extend({

  className: 'CDB-LayerLegends',

  events: {
    'click .js-toggle-layer': '_onToggleLayerCheckboxClicked'
  },

  initialize: function () {
    this._legendViews = [];

    // TODO: We want to do this binding after view has been rendered
    this.model.on('change:visible', this._onLayerVisibilityChanged, this);
  },

  render: function () {
    this.$el.html(
      template({
        layerName: this.model.getName(),
        isLayerVisible: this._isLayerVisible()
      })
    );

    this._renderLegends();
    return this;
  },

  _renderLegends: function () {
    _.each(this._getLegendModels(), this._renderLegend, this);
  },

  _renderLegend: function (legendModel) {
    var legendView = this._createLegendView(legendModel);
    this.$el.append(legendView.render().$el);
  },

  _createLegendView: function (legendModel) {
    var LegendViewClass = this._getViewConstructorForLegend(legendModel.get('type'));
    if (LegendViewClass) {
      var view = new LegendViewClass({
        model: legendModel
      });
      this._legendViews.push(view);
      return view;
    }

    throw new Error("Unsupported legend type: '" + legendModel.get('type') + "'");
  },

  _getViewConstructorForLegend: function (legendType) {
    if (legendType === 'bubble') {
      return BubbleLegendView;
    }
    if (legendType === 'category') {
      return CategoryLegendView;
    }
  },

  _onToggleLayerCheckboxClicked: function (event) {
    var isLayerEnabled = event.target.checked;
    if (isLayerEnabled) {
      this.model.show();
    } else {
      this.model.hide();
    }
  },

  _onLayerVisibilityChanged: function () {
    var toggleLayerCheckbox = this.$('.js-toggle-layer');
    if (this._isLayerVisible()) {
      toggleLayerCheckbox.prop('checked', true);
      this._enable();
    } else {
      toggleLayerCheckbox.prop('checked', false);
      this._disable();
    }
  },

  _enable: function () {
    this.$el.removeClass('is-disabled');
    _.invoke(this._getLegendViews(), 'enable');
  },

  _disable: function () {
    this.$el.addClass('is-disabled');
    _.invoke(this._getLegendViews(), 'disable');
  },

  _getLegendViews: function () {
    return this._legendViews || [];
  },

  _getLegendModels: function () {
    return this.model.getLegends();
  },

  _isLayerVisible: function () {
    return this.model.isVisible();
  }
});

module.exports = LayerLegendsView;
