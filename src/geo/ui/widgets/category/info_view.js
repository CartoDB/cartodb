var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cdb');
var template = require('./info_template.tpl');
var View = require('cdb/core/view');
var d3 = require('d3');

/**
 * Category info view
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
        min: this.dataModel.get('min'),
        max: this.dataModel.get('max'),
        nulls: this.dataModel.get('nulls')
      })
    );
    return this;
  },

  _initBinds: function() {
    this.dataModel.bind('change:data', this.render, this);
    this.viewModel.bind('change:search', this.toggle, this);
    this.add_related_model(this.dataModel);
    this.add_related_model(this.viewModel);
  },

  toggle: function() {
    this[ this.viewModel.isSearchEnabled() ? 'hide' : 'show' ]();
  }

});
