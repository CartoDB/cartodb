var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var DatasetsItem = require('./dataset_item_view');
var PlaceholderItem = require('./placeholder_item_view');
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
    if (this.collection.options.get('page') === 1) {
      this.clearSubViews();
    }

    this.collection.each(this._addItem, this);

    var klass = 'MapsList';

    if (this.collection._ITEMS_PER_PAGE * this.collection.options.get('page') >= this.collection.total_entries) {
      klass += ' is-bottom';
    }

    this.$el.attr('class', klass);

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
    this.collection.bind('reset', this.render, this);
    this.add_related_model(this.collection);
  },

  _fillEmptySlotsWithPlaceholderItems: function() {
    _.times(this._emptySlotsCount(), function(i) {
      var view = new PlaceholderItem();
      this.$el.append(view.render().el);
      this.addView(view);
    }, this);
  },

  _emptySlotsCount: function() {
    return (this.collection._ITEMS_PER_PAGE - this.collection.size()) % MAP_CARDS_PER_ROW;
  }

});
