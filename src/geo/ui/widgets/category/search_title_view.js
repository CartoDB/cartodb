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
    'keyup .js-textInput': '_onKeyupInput',
    'submit .js-form': '_onSubmitForm',
    'click .js-lock': '_lockCategories',
    'click .js-unlock': '_unlockCategories',
    'click .js-apply': '_applyLocked'
  },

  initialize: function() {
    this.viewModel = this.options.viewModel;
    this.dataModel = this.options.dataModel;
    this.search = this.options.search;
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      template({
        title: this.dataModel.get('title'),
        columnName: this.dataModel.get('column'),
        q: this.search.get('q'),
        isLocked: this.dataModel.isLocked(),
        canBeLocked: this.dataModel.canBeLocked(),
        isSearchEnabled: this.viewModel.isSearchEnabled(),
        canShowApply: this.dataModel.canApplyLocked()
      })
    );
    return this;
  },

  _initBinds: function() {
    this.viewModel.bind('change:search', this._onSearchToggled, this);
    this.dataModel.bind('change:filter change:locked lockedChange', this.render, this);
    this.add_related_model(this.dataModel);
    this.add_related_model(this.viewModel);
  },

  _onSearchToggled: function() {
    var isSearchEnabled = this.viewModel.isSearchEnabled();
    this[isSearchEnabled ? '_bindESC' : '_unbindESC']();
    this.render();
    if (isSearchEnabled) {
      this._focusOnInput();
    }
  },

  _onSubmitForm: function(ev) {
    if (ev) {
      ev.preventDefault();
    }
    var q = this.$('.js-textInput').val();
    this.search.set('q', q);
    if (this.search.isValid()) {
      this.search.fetch();
    } else {
      this.viewModel.toggleSearch();
    }
  },

  _focusOnInput: function() {
    var self = this;
    setTimeout(function() {
      self.$('.js-textInput').focus();
    }, 0);
  },

  _onKeyupInput: _.debounce(
    function(ev) {
      var q = this.$('.js-textInput').val();
      if (ev.keyCode !== 13 && ev.keyCode !== 27 && q !== "") {
        this._onSubmitForm();
      }
    }, 250
  ),

  function(ev) {
    if (ev.keyCode !== 13 && ev.keyCode !== 27) {
      this._onSubmitForm();
    }
  },

  _bindESC: function() {
    $(window).bind("keyup." + this.cid, _.bind(this._onKeyUp, this));
  },

  _unbindESC: function() {
    $(window).unbind("keyup." + this.cid);
  },

  _onKeyUp: function(ev) {
    if (ev.keyCode === 27) {
      this.viewModel.disableSearch();
    }
  },

  _lockCategories: function() {
    this.dataModel.lockCategories();
  },

  _unlockCategories: function() {
    this.dataModel.unlockCategories();
  },

  _applyLocked: function() {
    this.viewModel.toggleSearch();
    this.dataModel.applyLocked();
  },

  _onClickClose: function() {
    this.viewModel.disableSearch();
  },

  clean: function() {
    this._unbindESC();
    View.prototype.clean.call(this);
  }

});
