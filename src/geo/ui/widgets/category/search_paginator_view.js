var $ = require('jquery');
var _ = require('underscore');
var View = require('cdb/core/view');
var Model = require('cdb/core/model');
var PaginatorView = require('./paginator_view');
var template = require('./search_paginator_template.tpl');

module.exports = PaginatorView.extend({

  className: 'Widget-nav is-hidden Widget-contentSpaced',

  toggle: function() {
    this[ !this.viewModel.isSearchEnabled() ? 'hide' : 'show' ]();
  }

});
