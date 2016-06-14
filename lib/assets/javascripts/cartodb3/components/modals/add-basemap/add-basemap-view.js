var CoreView = require('backbone/core-view');
var template = require('./add-basemap.tpl');
var TabPaneView = require('../../tab-pane/tab-pane-view');
var TabPaneCollection = require('../../tab-pane/tab-pane-collection');

/**
 * Add basemap dialog
 */
module.exports = CoreView.extend({

  className: 'Dialog-content Dialog-content--expanded',

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
  },

  _initBinds: function () {

  },

  _initViews: function () {
    // this._layerDefinitionsCollection.setBaseLayer(plainBasemap.toJSON());

    var paneModels = [{
      name: 'XYZ',
      selected: true,
      createContentView: function () {
        return new CoreView();
      }
    }, {
      name: 'WMS/WMTS',
      selected: false,
      createContentView: function () {
        return new CoreView();
      }
    }, {
      name: 'NASA',
      selected: false,
      createContentView: function () {
        return new CoreView();
      }
    }, {
      name: 'Mapbox',
      selected: false,
      createContentView: function () {
        return new CoreView();
      }
    }, {
      name: 'TileJSON',
      selected: false,
      createContentView: function () {
        return new CoreView();
      }
    }];

    this._tabPaneCollection = new TabPaneCollection(paneModels);
    var tabPaneView = new TabPaneView({
      collection: this._tabPaneCollection
    });
    this.addView(tabPaneView);
    this.$('.js-content-container').append(tabPaneView.render().el);
  }

});
