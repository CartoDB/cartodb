var $ = cdb.$;
var _ = cdb._;
var View = cdb.core.View;
var d3 = cdb.d3;
var formatter = cdb.core.format;
var template = require('./stats_template.tpl');
var animationTemplate = require('./cats_template.tpl');
var AnimateValues = require('../../animate_values');

/**
 * Category stats info view
 *
 */

module.exports = View.extend({

  className: 'CDB-Widget-info CDB-Widget-textSmaller CDB-Widget-textSmaller--upper',
  tagName: 'dl',

  initialize: function() {
    this.viewModel = this.options.viewModel;
    this.dataModel = this.options.dataModel;
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      template({
        isSearchEnabled: this.viewModel.isSearchEnabled(),
        isSearchApplied: this.dataModel.isSearchApplied(),
        resultsCount: this.dataModel.getSearchCount(),
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

    return this;
  },

  _initBinds: function() {
    this.dataModel.bind('change:data change:locked change:search change:totalCount', this.render, this);
    this.viewModel.bind('change:search', this.render, this);
    this.add_related_model(this.dataModel);
    this.add_related_model(this.viewModel);
  },

  _getNullPercentage: function() {
    var nulls = this.dataModel.get('nulls');
    var total = this.dataModel.get('totalCount') || 0;
    return !nulls ? 0 : ((nulls/total) * 100).toFixed(2);
  },

  _getPreviousCategoriesPercentage: function() {
    var total = this.dataModel.previous('totalCount') || 0;
    var data = this.dataModel.getPreviousData();
    return this._getCategoriesPercentage(data, total);
  },

  _getCurrentCategoriesPercentage: function() {
    var total = this.dataModel.get('totalCount') || 0;
    var data = this.dataModel.getData().toJSON();
    return this._getCategoriesPercentage(data, total);
  },

  _getCategoriesPercentage: function(data, total) {
    if (!total) {
      return 0;
    }

    var currentTotal = data.reduce(function(memo, mdl) {
      return !mdl.agg ? ( memo + parseFloat(mdl.value)) : memo;
    }, 0);

    if (!currentTotal) {
      return 0;
    }

    return ((currentTotal / total) * 100).toFixed(2);
  },

  _getCategoriesSize: function() {
    return _.pluck(
      this.dataModel.getData().reject(function(mdl) {
        return mdl.get('agg');
      }), 'name').length;
  }
});
