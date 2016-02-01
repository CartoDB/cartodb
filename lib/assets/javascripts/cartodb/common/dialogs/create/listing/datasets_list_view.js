var cdb = require('cartodb.js-v3');
var DatasetsItem = require('./datasets/dataset_item_view');
var RemoteDatasetsItem = require('./datasets/remote_dataset_item_view');

/**
 * View representing the list of items
 */
module.exports = cdb.core.View.extend({

  tagName: 'ul',

  className: 'DatasetsList',

  events: {},

  _ITEMS: {
    'remotes':  RemoteDatasetsItem,
    'datasets': DatasetsItem
  },

  initialize: function() {
    this.user = this.options.user;
    this.createModel = this.options.createModel;
    this.collection.bind('reset', this.render, this);
    this.add_related_model(this.collection);
  },

  render: function() {
    this.clearSubViews();
    this.collection.each(this._addItem, this);
    return this;
  },

  _addItem: function(m, i) {
    var type = m.get('type') === "remote" ? 'remotes' : 'datasets';

    var item = new this._ITEMS[type]({
      model:       m,
      createModel: this.createModel,
      user:        this.user
    });

    this.addView(item);
    this.$el.append(item.render().el);
  },

  show: function() {
    this.$el.removeClass('is-hidden');
  },

  hide: function() {
    this.$el.addClass('is-hidden');
  }

});
