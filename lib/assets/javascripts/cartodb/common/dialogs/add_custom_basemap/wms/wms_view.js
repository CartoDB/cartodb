var cdb = require('cartodb.js');
var _ = require('underscore');
var ViewFactory = require('../../../view_factory.js');
var randomQuote = require('../../../view_helpers/random_quote.js');
var EnterUrlView = require('./enter_url_view.js');
var SelectLayerView = require('./select_layer_view.js');

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
    this._initViews();
    this._initBinds();
  },

  render: function() {
    this._panes.getActivePane().render();
    return this;
  },

  _initViews: function() {
    this._panes = new cdb.ui.common.TabPane({
      el: this.el
    });
    this.addView(this._panes);
    this._panes.addTab('enterUrl',
      new EnterUrlView({
        model: this.model
      })
    );
    this._panes.addTab('fetchingLayers',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Fetching layers…',
        quote: randomQuote()
      }).render()
    );
    this._panes.addTab('selectLayer',
      new SelectLayerView({
        model: this.model
      })
    );
    this._panes.active('enterUrl');
  },

  _initBinds: function() {
    this.model.bind('change:layersFetched', this._onFetchedLayers, this);
    this._panes.bind('tabEnabled', this.render, this);
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
      this._panes.active('fetchingLayers');
      this.model.fetchLayers(url);
    }
  },

  _onFetchedLayers: function() {
    var changeToPane = 'enterUrl';
    if (this.model.get('layers').length > 0) {
      changeToPane = 'selectLayer';
    }
    this._panes.active(changeToPane);
  }

});
