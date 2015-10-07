var cdb = require('cartodb.js');
var _ = require('underscore');
var DatasetsItem = require('./dataset_item_view');
var PlaceholderItem = require('./placeholder_item_view');
var MapTemplates = require('../common/map_templates');
var MAP_CARDS_PER_ROW = 3;

/**
 *  View representing the list of items
 */

module.exports = cdb.core.View.extend({

  tagName: 'ul',

  initialize: function() {
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.attr('class', 'MapsList');
    this.collection.each(this._addItem, this);

    if (this.collection.size() > 0) {
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
    var item = new DatasetsItem({
      model: m
    });

    this.addView(item);
    this.$el.append(item.render().el);
  },

  _initBinds: function() {
    this.collection.bind('loading', this._onItemsLoading, this);
    this.collection.bind('reset', this.render, this);
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
