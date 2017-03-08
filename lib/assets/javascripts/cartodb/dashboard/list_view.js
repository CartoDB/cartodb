var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var DatasetsItem = require('./datasets/datasets_item');
var MapsItem = require('./maps/maps_item');
var DeepInsightsItem = require('./maps/deep_insights_item');
var PlaceholderItem = require('./maps/placeholder_item_view');
var PlaceholderItemFirstMap = require('./maps/placeholder_item_first_map_view');
var RemoteDatasetsItem = require('./datasets/remote_datasets_item');
var MapTemplates = require('../common/map_templates');
var MAP_CARDS_PER_ROW = 3;

/**
 *  View representing the list of items
 */

module.exports = cdb.core.View.extend({
  tagName: 'div',

  events: {},

  _ITEMS: {
    'remotes': DatasetsItem,
    'datasets': DatasetsItem,
    'deepInsights': DeepInsightsItem,
    'maps': MapsItem
  },

  _container : undefined,
  _stateContainer: undefined,

  initialize: function() {
    this.router = this.options.router;
    this.user = this.options.user;
    this._initBinds();
  },

  render: function() {
    var self = this;
    this.clearSubViews();
    this.$el.empty();
    var searchInput = '<div style="padding: 10px 0 10px 0"><input type="text" class="search-bar-input" placeholder="<Filter>" style="width:100%;height:25px;line-height:25px;"></div>';
    if (this.router.model.isDatasets()) {
      this.$el.append(searchInput + '<table class="DatasetsTable"><thead><tr><th></th><th></th><th>Name</th><th>Description</th><th>Last Opened</th><th></th><th></th></tr></thead><tbody class="TableBody"></tbody></table>');
      this._container = this.$el.find('.TableBody');
      this._stateContainer = this.$el.find('.DatasetsTable');
    } else {
      this.$el.append(searchInput + '<ul class="MapsList"></ul>');
      this._container = this._stateContainer = this.$el.find('.MapsList');
    }

    this.collection.each(this._addItem, this);

    if (this.collection.total_entries == 0 && this.router.model.isMaps()) {
      this._showFirstMapPlaceholderItem();
    }

    return this;
  },

  show: function() {
    this._stateContainer.removeClass('is-hidden');
  },

  hide: function() {
    this._stateContainer.addClass('is-hidden');
  },

  _addItem: function(m) {
    var type = this.router.model.get('content_type');

    if (m.get('type') === "remote" && this.router.model.isDatasets()) {
      type = "remotes";
    }

    if (this.router.model.isDeepInsights()) {
      type = "deepInsights";
    }

    var item = new this._ITEMS[type]({
      model:  m,
      router: this.router,
      user:   this.user,
      type: m.get('type')
    });

    this.addView(item);
    this._container.append(item.render().el);
  },

  _initBinds: function() {
    this.collection.bind('loading', this._onItemsLoading, this);
    this.collection.bind('reset', this.render, this);
    this.add_related_model(this.collection);
  },

  _onItemsLoading: function() {
    this._stateContainer.addClass('is-loading');
  },

  _fillEmptySlotsWithPlaceholderItems: function() {
    var mapTemplates = _.shuffle(MapTemplates);
    _.times(this._emptySlotsCount(), function(i) {
      var d = mapTemplates[i];
      if (d) {
        var m = new cdb.core.Model(d);
        var view = new PlaceholderItem({
          model: m,
          collection: this.collection
        });
        this._container.append(view.render().el);
        this.addView(view);
      }
    }, this);
  },

  _showFirstMapPlaceholderItem: function() {
    var view = new PlaceholderItemFirstMap({
      model: {},
      collection: this.collection
    });
    this._container.append(view.render().el);
    this.addView(view);
  },

  _emptySlotsCount: function() {
    return (this.collection._ITEMS_PER_PAGE - this.collection.size()) % MAP_CARDS_PER_ROW;
  }

});
