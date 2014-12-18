var cdb = require('cartodb.js');
var DatasetsList = require('new_dashboard/datasets/datasets_list');

/**
 * View for the datasets route.
 *
 * The view is always instantiated and reviewed
 */
module.exports = cdb.core.View.extend({

  className: '',

  events: {},

  initialize: function() {
    this.router = this.options.router;
    this.user = this.options.user;
    this.localStorage = this.options.localStorage;

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    // Init views
    this._initViews();

    return this;
  },

  _initBinds: function() {
    this.router.model.on('change', this._onRouteChange, this);
  },

  _initViews: function() {
    // Datasets list
    var datasetsList = new DatasetsList({
      user: this.user,
      router: this.router,
      collection: this.collection
    });

    this.$el.append(datasetsList.render().el);
    this.addView(datasetsList);
  },

  _onRouteChange: function(m, c) {
    if (c.changes.content_type && m.get('content_type') === "datasets") {
      this._enableBinds();
      this.show();
    } else if (m.get('content_type') !== "datasets") {
      this._disableBinds();
      this.hide();
    }
  },

  _enableBinds: function() {
    // this.collection.on('reset', this.render, this);
    // this.collection.on('loading', this.render, this);
    // this.collection.on('loaded', this.render, this);
    // this.collection.on('error', this.render, this);
  },

  _disableBinds: function() {

  }

});
