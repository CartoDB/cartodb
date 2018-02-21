var CoreView = require('backbone/core-view');
var _ = require('underscore');
var SelectLayerView = require('./select-layer-view');
var ViewFactory = require('builder/components/view-factory');
var ErrorView = require('builder/components/error/error-view');
var renderLoading = require('builder/components/loading/render-loading');
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
    'click .js-clean-search': '_onCleanSearchClick',
    'click .js-search-link': '_submitSearch'
  },

  initialize: function (opts) {
    if (!opts.customBaselayersCollection) throw new Error('customBaselayersCollection is required');
    if (!opts.submitButton) throw new Error('submitButton is required');
    if (!opts.modalFooter) throw new Error('modalFooter is required');

    this._customBaselayersCollection = opts.customBaselayersCollection;
    this._submitButton = opts.submitButton;
    this._modalFooter = opts.modalFooter;
    this._debouncedUpdate = _.debounce(this._update.bind(this), 150);
    this._onClickBinded = this._onClickOK.bind(this);

    this._bindSubmitButton();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this._updateOkBtn();
    this._disableOkBtn(true);

    var view;

    switch (this.model.get('currentView')) {
      case 'savingLayer':
        this._disableModalFooter(true);

        view = ViewFactory.createByHTML(
          renderLoading({
            title: _t('components.modals.add-basemap.saving')
          })
        );
        break;
      case 'selectLayer':
        this._disableModalFooter(true);

        view = new SelectLayerView({
          model: this.model,
          customBaselayersCollection: this._customBaselayersCollection
        });
        break;
      case 'saveFail':
        this._disableModalFooter(true);

        view = new ErrorView({
          title: _t('components.modals.add-basemap.add-basemap-error')
        });
        break;
      case 'fetchingLayers':
        this._disableModalFooter(true);

        view = ViewFactory.createByHTML(
          renderLoading({
            title: _t('components.modals.add-basemap.fetching')
          })
        );
        break;
      case 'enterURL':
      default:
        this._disableModalFooter(false);

        view = ViewFactory.createByHTML(
          enterUrl({
            layersFetched: this.model.get('layersFetched'),
            layers: this.model.wmsLayersCollection
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
    this.model.bind('layersFetched', this.render, this);
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
    this._disableOkBtn(!this.$('.js-url').val());
    this.$('.js-error').removeClass('is-visible'); // resets error state when changed
  },

  _disableOkBtn: function (disable) {
    this._submitButton.toggleClass('is-disabled', disable);
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

  _onClickOK: function (e) {
    this.killEvent(e);

    var url = this.$('.js-url').val();

    if (url) {
      this.model.fetchLayers(url);
    }
  },

  _disableModalFooter: function (disable) {
    this._modalFooter.toggleClass('is-disabled', disable);
  },

  _updateOkBtn: function () {
    this._submitButton.find('span').text(_t('components.modals.add-basemap.get-layers'));
  },

  _bindSubmitButton: function () {
    this._submitButton.on('click', this._onClickBinded);
  },

  _unBindSubmitButton: function () {
    this._submitButton.off('click', this._onClickBinded);
  },

  clean: function () {
    this._unBindSubmitButton();
    CoreView.prototype.clean.call(this);
  }

});
