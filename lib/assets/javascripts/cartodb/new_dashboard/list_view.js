var cdb = require('cartodb.js');
var DatasetsItem = require('new_dashboard/datasets/datasets_item');
var MapsItem = require('new_dashboard/maps/maps_item');

/**
 * View representing the list of items
 */
module.exports = cdb.core.View.extend({

  tagName: 'ul',

  events: {},

  _ITEMS: {
    'datasets': DatasetsItem,
    'maps':     MapsItem
  },

  initialize: function() {
    this.router = this.options.router;
    this.user = this.options.user;
    this.collection.bind('remove', this.render, this);

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.attr('class', this.router.model.get('content_type') === 'datasets' ? 'DatasetsList' : 'MapsList');
    this.collection.each(this._addItem, this);
    return this;
  },

  _addItem: function(m, i) {
    var item = new this._ITEMS[this.router.model.get('content_type')]({
      model:  m,
      router: this.router,
      user:   this.user  
    });

    this.addView(item);
    this.$el.append(item.render().el);
  },

  _initBinds: function() {
    this.collection.on('reset', this.render, this);
    this.add_related_model(this.collection);
  }

});
