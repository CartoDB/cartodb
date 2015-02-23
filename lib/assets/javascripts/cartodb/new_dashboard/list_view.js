var cdb = require('cartodb.js');
var DatasetsItem = require('./datasets/datasets_item');
var MapsItem = require('./maps/maps_item');
var RemoteDatasetsItem = require('./datasets/remote_datasets_item');

/**
 * View representing the list of items
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
    this.$el.attr('class', this.router.model.get('content_type') === 'datasets' ? 'DatasetsList' : 'MapsList');
    this.collection.each(this._addItem, this);
    return this;
  },

  _addItem: function(m, i) {
    var type = (this.router.model.get('library') && 'remotes') || this.router.model.get('content_type');
    var item = new this._ITEMS[type]({
      model:  m,
      router: this.router,
      user:   this.user
    });
    item.bind('remoteSelected', function(d){
      this.trigger('remoteSelected', d, this);
    }, this)

    this.addView(item);
    this.$el.append(item.render().el);
  },

  _initBinds: function() {
    this.collection.bind('reset remove', this.render, this);
    this.add_related_model(this.collection);
  },

  show: function() {
    this.$el.removeClass('is-hidden');
  },

  hide: function() {
    this.$el.addClass('is-hidden');
  }

});
