var _ = require('underscore');
var $ = require('jquery');
var cdb = require('cartodb.js');
var DropdownView = require('../../dropdown/widget-dropdown-view');
var TooltipView = require('../../widget-tooltip-view');
var template = require('./search-title-template.tpl');

/**
 *  Show category title or search any category
 *  + another options for this widget, as in,
 *  colorize categories, lock defined categories...
 *
 */

module.exports = cdb.core.View.extend({
  events: {
    'keyup .js-textInput': '_onKeyupInput',
    'submit .js-form': '_onSubmitForm',
    'click .js-applyLocked': '_applyLocked',
    'click .js-applyColors': '_applyColors',
    'click .js-cancelColors': '_cancelColors'
  },

  initialize: function () {
    this.viewModel = this.options.viewModel;
    this.dataModel = this.options.dataModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        isCollapsed: this.viewModel.isCollapsed(),
        isColorApplied: this.viewModel.isColorApplied(),
        title: this.viewModel.get('title'),
        columnName: this.dataModel.get('column'),
        q: this.dataModel.getSearchQuery(),
        isLocked: this.viewModel.isLocked(),
        canBeLocked: this.viewModel.canBeLocked(),
        isSearchEnabled: this.viewModel.isSearchEnabled(),
        canShowApply: this.viewModel.canApplyLocked()
      })
    );
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.viewModel.bind('change:search', this._onSearchToggled, this);
    this.viewModel.bind('change:collapsed change:isColorsApplied', this.render, this);
    this.viewModel.lockedCategories.bind('change add remove', this.render, this);
    this.dataModel.bind('change:filter', this.render, this);
    this.add_related_model(this.dataModel);
    this.add_related_model(this.viewModel);
    this.add_related_model(this.viewModel.lockedCategories);
  },

  _initViews: function () {
    var dropdown = new DropdownView({
      target: this.$('.js-actions'),
      container: this.$el
    });

    dropdown.bind('click', function (action) {
      if (action === 'toggle') {
        this.viewModel.toggleCollapsed();
      }
    }, this);

    this.addView(dropdown);

    var colorsTooltip = new TooltipView({
      target: this.$('.js-colors')
    });
    $('body').append(colorsTooltip.render().el);
    this.addView(colorsTooltip);
  },

  _onSearchToggled: function () {
    var isSearchEnabled = this.viewModel.isSearchEnabled();
    this[isSearchEnabled ? '_bindESC' : '_unbindESC']();
    this.render();
    if (isSearchEnabled) {
      this._focusOnInput();
    }
  },

  _onSubmitForm: function (ev) {
    if (ev) {
      ev.preventDefault();
    }
    var q = this.$('.js-textInput').val();
    if (this.dataModel.getSearchQuery() !== q) {
      this.dataModel.setSearchQuery(q);
      if (this.dataModel.isSearchValid()) {
        this.dataModel.applySearch();
      }
    }
  },

  _focusOnInput: function () {
    var self = this;
    setTimeout(function () {
      self.$('.js-textInput').focus();
    }, 0);
  },

  _onKeyupInput: _.debounce(
    function (ev) {
      var q = this.$('.js-textInput').val();
      if (ev.keyCode !== 13 && ev.keyCode !== 27 && q !== '') {
        this._onSubmitForm();
      }
    }, 250
  ),

  _bindESC: function () {
    $(document).bind('keyup.' + this.cid, _.bind(this._onKeyUp, this));
  },

  _unbindESC: function () {
    $(document).unbind('keyup.' + this.cid);
  },

  _onKeyUp: function (ev) {
    if (ev.keyCode === 27) {
      this._cancelSearch();
      return false;
    }
  },

  _applyLocked: function () {
    this.viewModel.toggleSearch();
    this.viewModel.applyLocked();
  },

  _applyColors: function () {
    this.viewModel.applyColors();
  },

  _cancelColors: function () {
    this.viewModel.cancelColors();
  },

  _cancelSearch: function () {
    this.viewModel.cleanSearch();
    this.viewModel.disableSearch();
  },

  clean: function () {
    this._unbindESC();
    cdb.core.View.prototype.clean.call(this);
  }

});
