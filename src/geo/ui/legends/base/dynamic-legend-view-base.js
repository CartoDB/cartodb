var errorTitleTemplate = require('./error-title.tpl');
var noDataAvailableTitleTemplate = require('./no-data-available-title.tpl');
var LegendViewBase = require('./legend-view-base');

var DynamicLegendViewBase = LegendViewBase.extend({

  initialize: function (deps) {
    this._placeholderTemplate = deps.placeholderTemplate;

    LegendViewBase.prototype.initialize.apply(this, arguments);
  },

  render: function () {
    LegendViewBase.prototype.render.apply(this, arguments);
    this._toggleLoadingClass();
    return this;
  },

  _generateHTML: function () {
    var html = [];
    if (this.model.isSuccess()) {
      if (this.model.hasData()) {
        html.push(this._getLegendHTML());
      } else {
        html.push(this._getNoDataAvailableHTML());
        html.push(this._getPlaceholderHTML());
      }
    } else if (this.model.isError()) {
      html.push(this._getErrorHeaderHTML());
      html.push(this._getPlaceholderHTML());
    } else if (this.model.isLoading()) {
      html.push(this._getPlaceholderHTML());
    }
    return html.join('\n');
  },

  _getPlaceholderHTML: function () {
    return this._placeholderTemplate && this._placeholderTemplate() || '';
  },

  _getErrorHeaderHTML: function () {
    return errorTitleTemplate();
  },

  _getNoDataAvailableHTML: function () {
    return noDataAvailableTitleTemplate();
  },

  _toggleLoadingClass: function () {
    this.$el.toggleClass('is-loading', this.model.isLoading());
  }
});

module.exports = DynamicLegendViewBase;
