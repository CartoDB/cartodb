var cdb = require('cartodb.js');
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
    this.routerModel = this.options.routerModel;
    this.createModel = this.options.createModel;
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.collection.each(this._addItem, this);
    return this;
  },

  _addItem: function(m, i) {
    var type = m.get('type') === "remote" ? 'remotes' : 'datasets';

    // Check if the dataset was previously selected
    if (this.createModel.isDatasetSelected(m)) {
      m.set('selected', true);
    }

    var item = new this._ITEMS[type]({
      model:  m,
      routerModel: this.routerModel,
      user:   this.user
    });
    item.bind('remoteSelected', function(d, mdl, v){
      if (this.createModel.get('type') === "map") {
        // If create dialog wants to create a map
        // select the dataset!
        v.trigger('itemSelected', mdl, v);
      } else {
        // If create dialog wants to create a dataset,
        // let's import it :)
        this.trigger('remoteSelected', d, this);
      }
    }, this);

    item.bind('itemSelected', function(mdl, v){
      if (mdl.get('selected')) {
        this.createModel.removeSelectedDataset(mdl);
        mdl.set('selected', false);
      } else {
        var added = this.createModel.addSelectedDataset(mdl);
        if (added) {
          mdl.set('selected', true);
        }
      }
    }, this);

    this.addView(item);
    this.$el.append(item.render().el);
  },

  _initBinds: function() {
    this.collection.bind('reset', this.render, this);
    this.add_related_model(this.collection);
  },

  show: function() {
    this.$el.removeClass('is-hidden');
  },

  hide: function() {
    this.$el.addClass('is-hidden');
  }

});
