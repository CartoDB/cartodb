var cdb = require('cartodb.js');
var _ = require('underscore');
var DatasetsItem = require('./datasets/datasets_item');
var MapsItem = require('./maps/maps_item');
var PlaceholderItem = require('./maps/placeholder_item_view');
var RemoteDatasetsItem = require('./datasets/remote_datasets_item');
var MapTemplates = require('../new_common/map_templates');
var MAP_CARDS_PER_ROW = 3;

/**
 *  View representing the list of items
 */

module.exports = cdb.core.View.extend({

  tagName: 'ul',

  events: {},

  _ITEMS: {
    'remotes':  RemoteDatasetsItem,
    'datasets': DatasetsItem,
    'maps':     MapsItem
  },

  initialize: function() {
    this.router = this.options.router;
    this.user = this.options.user;
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.attr('class', this.router.model.isDatasets() ? 'DatasetsList' : 'MapsList');
    this.collection.each(this._addItem, this);

    if (this.router.model.isMaps() && this.collection.size() > 0) {
      this._fillEmptySlotsWithPlaceholderItems();
    }

    return this;
  },

  show: function() {
    this.$el.removeClass('is-hidden');
  },

  hide: function() {
    this.$el.addClass('is-hidden');
  },

  _addItem: function(m) {
    var type = this.router.model.get('content_type');

    if (m.get('type') === "remote" && this.router.model.isDatasets()) {
      type = "remotes"
    }

    var item = new this._ITEMS[type]({
      model:  m,
      router: this.router,
      user:   this.user
    });

    this.addView(item);
    this.$el.append(item.render().el);
  },

  _initBinds: function() {
    this.collection.bind('loading', this._onItemsLoading, this);
    this.collection.bind('reset remove', this.render, this);
    this.add_related_model(this.collection);
  },

  _onItemsLoading: function() {
    this.$el.addClass('is-loading');
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
        this.$el.append(view.render().el);
        this.addView(view);  
      }
    }, this);
  },

  _emptySlotsCount: function() {
    return (this.collection._ITEMS_PER_PAGE - this.collection.size()) % MAP_CARDS_PER_ROW;
  }

});
