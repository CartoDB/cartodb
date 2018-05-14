var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var DropdownView = require('../../dropdown/widget-dropdown-view');
var TipsyTooltipView = require('../../../../builder/components/tipsy-tooltip-view');
var template = require('./search-title-template.tpl');
var layerColors = require('../../../util/layer-colors');
var analyses = require('../../../data/analyses');
var escapeHTML = require('../../../util/escape-html');

/**
 *  Show category title or search any category
 *  + another options for this widget, as in,
 *  colorize categories, lock defined categories...
 *
 */

module.exports = CoreView.extend({
  events: {
    'keyup .js-textInput': '_onKeyupInput',
    'submit .js-form': '_onSubmitForm',
    'click .js-applyLocked': '_applyLocked',
    'click .js-autoStyle': '_autoStyle',
    'click .js-cancelAutoStyle': '_cancelAutoStyle'
  },

  initialize: function () {
    if (!this.options.widgetModel) throw new Error('widgetModel is required');
    if (!this.options.dataviewModel) throw new Error('dataviewModel is required');
    if (!this.options.layerModel) throw new Error('layerModel is required');

    this.model = this.options.widgetModel;
    this.dataviewModel = this.options.dataviewModel;
    this.layerModel = this.options.layerModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    var sourceId = this.dataviewModel.get('source').id;
    var letter = layerColors.letter(sourceId);
    var sourceColor = layerColors.getColorForLetter(letter);
    var sourceType = this.dataviewModel.getSourceType() || '';
    var isSourceType = this.dataviewModel.isSourceType();
    var layerName = isSourceType
      ? this.model.get('table_name')
      : this.layerModel.get('layer_name');

    this.$el.html(
      template({
        isCollapsed: this.model.get('collapsed'),
        isAutoStyleEnabled: this._isAutoStyleButtonVisible(),
        isAutoStyle: this.model.isAutoStyle(),
        title: this.model.get('title'),
        sourceId: sourceId,
        sourceType: analyses.title(sourceType),
        isSourceType: isSourceType,
        showSource: this.model.get('show_source') && letter !== '',
        sourceColor: sourceColor,
        layerName: escapeHTML(layerName),
        columnName: this.dataviewModel.get('column'),
        q: this.dataviewModel.getSearchQuery(),
        isLocked: this.model.isLocked(),
        canBeLocked: this.model.canBeLocked(),
        isSearchEnabled: this.model.isSearchEnabled(),
        canShowApply: this.model.canApplyLocked()
      })
    );
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:search', this._onSearchToggled);
    this.listenTo(this.model, 'change:title change:collapsed change:autoStyle change:style', this.render);
    this.listenTo(this.model.lockedCategories, 'change add remove', this.render);
    this.listenTo(this.dataviewModel, 'change:column', this.render);
    this.listenTo(this.dataviewModel.filter, 'change', this.render);
    this.listenTo(this.layerModel, 'change:visible change:cartocss change:layer_name', this.render);
  },

  _initViews: function () {
    var dropdown = new DropdownView({
      model: this.model,
      target: '.js-actions',
      container: this.$el
    });
    this.addView(dropdown);

    var colorsTooltip = new TipsyTooltipView({
      el: this.$el.find('.js-colors'),
      gravity: 'auto'
    });
    this.addView(colorsTooltip);

    var actionsTooltip = new TipsyTooltipView({
      el: this.$el.find('.js-actions'),
      gravity: 'auto'
    });
    this.addView(actionsTooltip);
  },

  _isAutoStyleButtonVisible: function () {
    return this.model.isAutoStyleEnabled() &&
      this.layerModel.get('visible') &&
      this.model.hasColorsAutoStyle();
  },

  _onSearchToggled: function () {
    var isSearchEnabled = this.model.isSearchEnabled();
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
    this.model.toggleSearch();
    this.model.applyLocked();
  },

  _autoStyle: function () {
    this.model.autoStyle();
  },

  _cancelAutoStyle: function () {
    this.model.cancelAutoStyle();
  },

  _cancelSearch: function () {
    this.model.cleanSearch();
    this.model.disableSearch();
  },

  clean: function () {
    this._unbindESC();
    CoreView.prototype.clean.call(this);
  }

});
