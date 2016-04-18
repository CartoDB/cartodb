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
    'click .js-autoStyle': '_autoStyle',
    'click .js-cancelAutoStyle': '_cancelAutoStyle'
  },

  initialize: function () {
    this.widgetModel = this.options.widgetModel;
    this.dataviewModel = this.options.dataviewModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        isCollapsed: this.widgetModel.get('collapsed'),
        isAutoStyle: this.widgetModel.isAutoStyle(),
        title: this.widgetModel.get('title'),
        columnName: this.dataviewModel.get('column'),
        q: this.dataviewModel.getSearchQuery(),
        isLocked: this.widgetModel.isLocked(),
        canBeLocked: this.widgetModel.canBeLocked(),
        isSearchEnabled: this.widgetModel.isSearchEnabled(),
        canShowApply: this.widgetModel.canApplyLocked()
      })
    );
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.widgetModel.bind('change:search', this._onSearchToggled, this);
    this.widgetModel.bind('change:title change:collapsed change:autoStyle', this.render, this);
    this.widgetModel.lockedCategories.bind('change add remove', this.render, this);
    this.add_related_model(this.widgetModel);
    this.add_related_model(this.widgetModel.lockedCategories);

    this.dataviewModel.filter.bind('change', this.render, this);
    this.add_related_model(this.dataviewModel.filter);
  },

  _initViews: function () {
    var dropdown = new DropdownView({
      target: this.$('.js-actions'),
      container: this.$el
    });

    dropdown.bind('click', function (action) {
      if (action === 'toggle') {
        this.widgetModel.set('collapsed', !this.widgetModel.get('collapsed'));
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
    var isSearchEnabled = this.widgetModel.isSearchEnabled();
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
    if (this.dataviewModel.getSearchQuery() !== q) {
      this.dataviewModel.setSearchQuery(q);
      if (this.dataviewModel.isSearchValid()) {
        this.dataviewModel.applySearch();
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
    this.widgetModel.toggleSearch();
    this.widgetModel.applyLocked();
  },

  _autoStyle: function () {
    this.widgetModel.autoStyle();
  },

  _cancelAutoStyle: function () {
    this.widgetModel.cancelAutoStyle();
  },

  _cancelSearch: function () {
    this.widgetModel.cleanSearch();
    this.widgetModel.disableSearch();
  },

  clean: function () {
    this._unbindESC();
    cdb.core.View.prototype.clean.call(this);
  }

});
