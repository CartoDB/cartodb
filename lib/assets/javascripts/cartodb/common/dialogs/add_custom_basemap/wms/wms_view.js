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
    'keydown .js-url': '_update',
    'paste .js-url': '_update',
    'click .js-fetch-layers': '_onClickFetchLayers'
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
      case 'enterUrl':
      default:
        view = ViewFactory.createByTemplate('common/dialogs/add_custom_basemap/wms/enter_url', {
          layersFetched: this.model.get('layersFetched'),
          layers: this.model.get('layers')
        });
        break;
    }
    this.addView(view);
    this.$el.append(view.render().el);

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
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

  _onClickFetchLayers: function(ev) {
    this.killEvent(ev);
    var url = this.$('.js-url').val();
    if (url) {
      this.model.fetchLayers(url);
    }
  }

});
