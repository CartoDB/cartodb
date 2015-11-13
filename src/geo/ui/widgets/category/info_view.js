var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cdb');
var template = require('./info.tpl');
var View = require('cdb/core/view');
var d3 = require('d3');

/**
 * Category info view
 */

module.exports = View.extend({

  className: 'Widget-info Widget-textSmaller Widget-textSmaller--upper',
  tagName: 'dl',

  initialize: function() {
    this._initBinds();
  },

  render: function() {
    var format =  d3.format('.2s');
    this.$el.html(
      template({
        min: format(this.model.get('min')),
        max: format(this.model.get('max')),
        nulls: format(this.model.get('nulls') || 0)
      })
    );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:data', this.render, this);
  }

});
