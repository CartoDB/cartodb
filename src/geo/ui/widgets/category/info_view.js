var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cdb');
var template = require('./info.tpl');

/**
 * Category info view
 */

module.exports = cdb.core.View.extend({

  className: 'Widget-info Widget-textSmaller Widget-textSmaller--upper',
  tagName: 'dl',

  initialize: function() {
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      template({
        avg: this.model.get('avg'),
        min: this.model.get('min'),
        max: this.model.get('max'),
        nulls: this.model.get('nulls')
      })
    );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:data', this.render, this);
  }

});
