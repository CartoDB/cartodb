var CoreView = require('backbone/core-view');
var _ = require('underscore');
var SelectLayerView = require('./select-layer-view.js');
var ViewFactory = require('../../../view-factory');
var ErrorView = require('../../../error/error-view');
var renderLoading = require('../../../loading/render-loading');
var enterUrl = require('./enter-url.tpl');
var $ = require('jquery');

/**
 * Represents the WMS/WMTS tab category.
 * Current state is defined by presence (or lack of) layers
 */
module.exports = CoreView.extend({

  events: {
    'keydown .js-search-input': '_onKeyDown',
    'submit .js-search-form': 'killEvent',
    'keydown .js-url': '_onKeydown',
    'paste .js-url': '_onPaste',
    'click .js-fetch-layers': '_onClickFetchLayers',
    'click .js-clean-search': '_onCleanSearchClick',
    'click .js-search-link': '_submitSearch'
  },

  initialize: function () {
    this._debouncedUpdate = _.debounce(this._update.bind(this), 150);
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    var view;

    switch (this.model.get('currentView')) {
      case 'savingLayer':
        view = ViewFactory.createByHTML(
          renderLoading({
            title: _t('components.modals.add-basemap.saving')
          })
        );
        break;
      case 'selectLayer':
        view = new SelectLayerView({
          model: this.model
        });
        break;
      case 'saveFail':
        view = new ErrorView({
          title: _t('components.modals.add-basemap.add-basemap-error')
        });
        break;
      case 'fetchingLayers':
        view = ViewFactory.createByHTML(
          renderLoading({
            title: _t('components.modals.add-basemap.fetching')
          })
        );
        break;
      case 'enterURL':
      default:
        view = ViewFactory.createByHTML(
          enterUrl({
            layersFetched: this.model.get('layersFetched'),
            layers: this.model.layers
          })
        );
        break;
    }
    this.addView(view);
    this.$el.append(view.render().el);

    this.$('.js-search-input').focus();

    return this;
  },

  _showCleanSearchButton: function () {
    this.$('.js-clean-search').show();
  },

  _hideCleanSearchButton: function () {
    this.$('.js-clean-search').hide();
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this);
    this.model.bind('change', this._onChangeSearchQuery, this);
    this.model.layers.bind('reset', this.render, this);
  },

  _onKeydown: function (e) {
    e.stopPropagation();
    this._debouncedUpdate();
  },

  _onPaste: function (e) {
    e.stopPropagation();
    this._debouncedUpdate();
  },

  _update: function (e) {
    this._enableFetchLayersButton(!!this.$('.js-url').val());
    this.$('.js-error').removeClass('is-visible'); // resets error state when changed
  },

  _enableFetchLayersButton: function (enable) {
    this.$('.js-fetch-layers')[enable ? 'removeClass' : 'addClass']('is-disabled');
  },

  _onKeyDown: function (e) {
    var enterPressed = (e.keyCode === $.ui.keyCode.ENTER);
    if (enterPressed) {
      this.killEvent(e);
      this._submitSearch();
    }
  },

  _submitSearch: function (e) {
    this.killEvent(e);

    this.model.set('searchQuery', this.$('.js-search-input').val());
  },

  _onChangeSearchQuery: function () {
    var searchQuery = this.model.get('searchQuery');

    if (!searchQuery) {
      this._hideCleanSearchButton();
    }
  },

  _onCleanSearchClick: function (e) {
    this.killEvent(e);
    this.model.set('searchQuery', '');
  },

  _onClickFetchLayers: function (e) {
    this.killEvent(e);
    var url = this.$('.js-url').val();
    if (url) {
      this.model.fetchLayers(url);
    }
  }

});
