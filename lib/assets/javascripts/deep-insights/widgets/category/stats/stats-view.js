var _ = require('underscore');
var CoreView = require('backbone/core-view');
var formatter = require('../../../formatter');
var template = require('./stats-template.tpl');
var animationTemplate = require('./cats-template.tpl');
var AnimateValues = require('../../animate-values');

/**
 * Category stats info view
 *
 */

module.exports = CoreView.extend({
  className: 'CDB-Widget-info CDB-Text CDB-Size-small u-secondaryTextColor u-upperCase u-tSpace',
  tagName: 'dl',

  initialize: function () {
    this.widgetModel = this.options.widgetModel;
    this.dataviewModel = this.options.dataviewModel;
    this._initBinds();
  },

  render: function () {
    this.$el.html(
      template({
        isSearchEnabled: this.widgetModel.isSearchEnabled(),
        isSearchApplied: this.dataviewModel.isSearchApplied(),
        isLocked: this.widgetModel.isLocked(),
        isOtherAvailable: this.dataviewModel.isOtherAvailable(),
        resultsCount: this.dataviewModel.getSearchCount(),
        totalCats: this._getCategoriesSize(),
        nullsPer: this._getNullPercentage(),
        catsPer: this._getCurrentCategoriesPercentage()
      })
    );

    var animator = new AnimateValues({
      el: this.$el
    });

    animator.animateFromValues(this._getPreviousCategoriesPercentage(), this._getCurrentCategoriesPercentage(), '.js-cats',
      animationTemplate, { defaultValue: '-', animationSpeed: 700, formatter: formatter.formatValue }
    );

    this._checkVisibility();

    return this;
  },

  _initBinds: function () {
    this.dataviewModel.bind('change:data change:totalCount', this.render, this);
    this.widgetModel.bind('change:search change:locked', this.render, this);
    this.widgetModel.bind('change:show_stats change:collapsed', this._checkVisibility, this);
    this.add_related_model(this.dataviewModel);
    this.add_related_model(this.widgetModel);
  },

  _getNullPercentage: function () {
    var nulls = this.dataviewModel.get('nulls');
    var total = this.dataviewModel.get('totalCount') || 0;
    return !nulls ? 0 : ((nulls / total) * 100).toFixed(2);
  },

  _getPreviousCategoriesPercentage: function () {
    var total = this.dataviewModel.previous('totalCount') || 0;
    var data = this.dataviewModel.getPreviousData();
    return this._getCategoriesPercentage(data, total);
  },

  _getCurrentCategoriesPercentage: function () {
    var total = this.dataviewModel.get('totalCount') || 0;
    var data = this.dataviewModel.getData().toJSON();
    return this._getCategoriesPercentage(data, total);
  },

  _getCategoriesPercentage: function (data, total) {
    if (!total) {
      return 0;
    }

    var currentTotal = data.reduce(function (memo, mdl) {
      return !mdl.agg ? (memo + parseFloat(mdl.value)) : memo;
    }, 0);

    if (!currentTotal) {
      return 0;
    }

    return ((currentTotal / total) * 100).toFixed(2);
  },

  _getCategoriesSize: function () {
    return _.pluck(
      this.dataviewModel.getData().reject(function (mdl) {
        return mdl.get('agg');
      }), 'name').length;
  },

  _checkVisibility: function () {
    var isVisible = !!this.widgetModel.get('show_stats') && !this.widgetModel.get('collapsed');
    this.$el.toggle(isVisible);
  }
});
