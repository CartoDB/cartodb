var cdb = require('cartodb.js');
var _ = require('underscore');
var randomQuote = require('../../../view_helpers/random_quote.js');
var SelectLayerView = require('./select_layer_view.js');
var ViewFactory = require('../../../view_factory.js');

/**
 * Represents the WMS/WMTS tab category.
 * Current state is defined by presence (or lack of) layers
 */
module.exports = cdb.core.View.extend({

  events: {
    'keydown .js-search-input': '_onKeyDown',
    'submit .js-search-form': 'killEvent',
    'keydown .js-url': '_update',
    'paste .js-url': '_update',
    'click .js-fetch-layers': '_onClickFetchLayers',
    'click .js-clean-search': '_onCleanSearchClick',
    'click .js-search-link': '_submitSearch'
  },

  initialize: function() {
    this.elder('initialize');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    var view;

    switch (this.model.get('currentView')) {
      case 'savingLayer':
        view = ViewFactory.createByTemplate('common/templates/loading', {
          title: 'Saving layer…',
          quote: randomQuote()
        });
        break;
      case 'selectLayer':
        view = new SelectLayerView({
          q: this.q,
          model: this.model
        });
        break;
      case 'saveFail':
        view = ViewFactory.createByTemplate('common/templates/fail', {
          msg: ''
        });
        break;
      case 'fetchingLayers':
        view = ViewFactory.createByTemplate('common/templates/loading', {
          title: 'Fetching layers…',
          quote: randomQuote()
        });
        break;
      case 'enterURL':
      default:
        view = ViewFactory.createByTemplate('common/dialogs/add_custom_basemap/wms/enter_url', {
          layersFetched: this.model.get('layersFetched'),
          layers: this.model.get('layers')
        });
        break;
    }
    this.addView(view);
    this.$el.append(view.render().el);

    if (!this.q) {
      this._hideCleanSearchButton();
    }

    this.$(".js-search-input").focus();

    return this;
  },

  _showCleanSearchButton: function() {
    this.$('.js-clean-search').show();
  },

  _hideCleanSearchButton: function() {
    this.$('.js-clean-search').hide();
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
    this.model.get("layers").bind('reset', this.render, this);
  },

  _update: function(ev) {
    ev.stopPropagation();
    this._debouncedUpdate();
  },

  _debouncedUpdate: _.debounce(function() {
    this._enableFetchLayersButton(!!this.$('.js-url').val());
    this.$('.js-error').removeClass('is-visible'); // resets error state when changed
  }, 100),

  _enableFetchLayersButton: function(enable) {
    this.$('.js-fetch-layers')[ enable ? 'removeClass' : 'addClass' ]('is-disabled');
  },

  _onKeyDown: function(ev) {
    var enterPressed = (ev.keyCode == $.ui.keyCode.ENTER);
    if (enterPressed) {
      this.killEvent(ev);
      this._submitSearch();
    } 
  },

  _submitSearch: function(ev) {
    this.killEvent(ev);

    this.q = this.$(".js-search-input").val();

    if (!this.q) {
      this._cleanSearch();
    } else {

      if (!this.fetchedLayers) { // make a copy of the fetched layers
        var layers = this.model.get("layers");
        this.fetchedLayers = _.clone(layers);
      }

      var results = this._searchFetchedLayers(this.q);
      this.model.get("layers").reset(results);

    }
  },

  _searchFetchedLayers: function(search_term) {
    return this.fetchedLayers.filter(function(layer) {
      return layer.get("name").includes(search_term);
    }, this);
  },

  _onCleanSearchClick: function(ev) {
    this.killEvent(ev);
    this.q = null;
    this._cleanSearch();
  },

  _cleanSearch: function(ev) {
    if (this.fetchedLayers) {
      this.model.get("layers").reset(this.fetchedLayers.models);
    }
  },

  _onClickFetchLayers: function(ev) {
    this.killEvent(ev);
    var url = this.$('.js-url').val();
    if (url) {
      this.model.fetchLayers(url);
    }
  }

});
