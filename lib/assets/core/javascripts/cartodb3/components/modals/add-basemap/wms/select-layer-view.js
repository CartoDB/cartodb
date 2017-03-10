var CoreView = require('backbone/core-view');
var template = require('./select-layer.tpl');
var WMSLayersView = require('./wms-layers-view');

/**
 * Sub view, to select what layer to use as basemap.
 */
module.exports = CoreView.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.customBaselayersCollection) throw new Error('customBaselayersCollection is required');
    this._customBaselayersCollection = opts.customBaselayersCollection;
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(
      template({
        searchQuery: this.model.get('searchQuery'),
        layersFound: this.model.getLayers(),
        layersAvailableCount: this.model.layersAvailableCount()
      })
    );

    this._initViews();

    return this;
  },

  _initViews: function () {
    var wmsListView = new WMSLayersView({
      model: this.model,
      customBaselayersCollection: this._customBaselayersCollection
    });

    this.addView(wmsListView);
    this.$('.js-layers').append(wmsListView.render().el);
  },

  _onClickBack: function (e) {
    this.killEvent(e);
    this.model.set('currentView', 'enterURL');
  }

});
