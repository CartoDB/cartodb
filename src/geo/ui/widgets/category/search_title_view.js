var _ = require('underscore');
var cdb = require('cdb');
var $ = require('jquery');
var View = require('cdb/core/view');
var template = require('./search_title_template.tpl');

/**
 * Category content view
 */
module.exports = View.extend({

  events: {
    'click .js-close': '_onClickClose',
    'submit .js-form': '_onSubmitForm'
  },

  initialize: function() {
    this._title = this.options.title;
    this.search = this.options.search;
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      template({
        title: this._title,
        isSearchEnabled: this.model.isSearchEnabled()
      })
    );
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:search', this._onSearchToggled, this);
  },

  _onSearchToggled: function() {
    var isSearchEnabled = this.model.isSearchEnabled();
    this[isSearchEnabled ? '_bindESC' : '_unbindESC']();
    this.render();
  },

  _onSubmitForm: function(ev) {
    ev.preventDefault();
    var q = this.$('.js-textInput').val();
    this.search.set('q', q);
    if (this.search.isValid()) {
      this.search.fetch();
    } else {
      this.model.toggleSearch();
    }
  },

  _bindESC: function() {
    $(window).bind("keyup." + this.model.get('id'), _.bind(this._onKeyUp, this));
  },

  _unbindESC: function() {
    $(window).unbind("keyup." + this.model.get('id'));
  },

  _onKeyUp: function(ev) {
    if (ev.keyCode === 27) {
      this.model.disableSearch();
    }
  },

  _onClickClose: function() {
    this.model.disableSearch();
  },

  clean: function() {
    this._unbindESC();
    View.prototype.clean.call(this);
  }

});
