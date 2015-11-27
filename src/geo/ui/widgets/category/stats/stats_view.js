var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cdb');
var template = require('./stats_template.tpl');
var View = require('cdb/core/view');
var d3 = require('d3');

/**
 * Category stats info view
 *
 */

module.exports = View.extend({

  className: 'Widget-info Widget-textSmaller Widget-textSmaller--upper',
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
        catsPer: this._getCagetoriesPercentage()
      })
    );
    return this;
  },

  _initBinds: function() {
    this.dataModel.bind('change:data change:locked change:search change:totalCount', this.render, this);
    this.viewModel.bind('change:search', this.render, this);
    this.add_related_model(this.dataModel);
    this.add_related_model(this.viewModel);
  },

  _getNullPercentage: function(attr) {
    var nulls = this.dataModel.get('nulls');
    var total = this.dataModel.get('totalCount') || 0;
    var per = !nulls ? 0 : ((nulls/total) * 100).toFixed(2);
    return per;
  },

  _getCagetoriesPercentage: function(attr) {
    var total = this.dataModel.get('totalCount') || 0;
    var data = this.dataModel.getData();
    if (!total) {
      return 0;
    }

    var currentTotal = data.reduce(function(memo, mdl) {
        return !mdl.get('agg') ? ( memo + parseFloat(mdl.get('value'))) : memo;
      },
      0
    );

    if (!currentTotal) {
      return 0;
    }

    return ((currentTotal / total) * 100).toFixed(2);
  },

  _getCategoriesSize: function() {
    return _.pluck(
      this.dataModel.getData().reject(function(mdl) {
        return mdl.get('agg')
      }),
      'name'
    ).length;
  }

});
