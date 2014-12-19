var cdb = require('cartodb.js');
var DatasetsItem = require('new_dashboard/datasets/datasets_item');

/**
 * View representing the list of items under the datasets route.
 */
module.exports = cdb.core.View.extend({

  className: 'DatasetsList',
  tagName: 'ul',

  events: {},

  initialize: function() {
    this.router = this.options.router;
    this.user = this.options.user;

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    this.collection.each(this._addDataset, this);

    return this;
  },

  _addDataset: function(m, i) {
    var item = new DatasetsItem({
      model:  m,
      router: this.router,
      user:   this.user
    });

    this.addView(item);
    this.$el.append(item.render().el);

    console.log(m);
  },

  _initBinds: function() {
    this.router.model.on('change', this._onRouteChange, this);
  },

  _onRouteChange: function(m, c) {
    if (c.changes.content_type && m.get('content_type') === "datasets") {
      this._enableBinds();
    } else if (m.get('content_type') !== "datasets") {
      this._disableBinds();
    }
  },

  _enableBinds: function() {
    this.collection.on('reset', this.render, this);
  },

  _disableBinds: function() {
    this.collection.off('reset', this.render, this);
  }

});
