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
        min: this.dataModel.get('min'),
        max: this.dataModel.get('max'),
        nulls: this.dataModel.get('nulls')
      })
    );
    return this;
  },

  _initBinds: function() {
    this.dataModel.bind('change:data change:locked change:search', this.render, this);
    this.viewModel.bind('change:search', this.render, this);
    this.add_related_model(this.dataModel);
    this.add_related_model(this.viewModel);
  }

});
