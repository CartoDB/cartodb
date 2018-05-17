const CoreView = require('backbone/core-view');

module.exports = CoreView.extend({

  className: 'table',

  initialize: function () {
    this.user = this.options.user;
    this.sqlView = this.options.sqlView;
    this.geocoder = this.options.geocoder;
    this.backgroundPollingModel = this.options.backgroundPollingModel;
    this._initBinds();
  },

  setActiveLayer: function (layerView) {
    var recreate = !!this.tableView;
    this.deactivated();
    this.model = layerView.table;
    this.layer = layerView.model;
    this.sqlView = layerView.sqlView;
    if (recreate) {
      this.activated();
    }
  },

  _initBinds: function () {
    // Geocoder binding
    this.geocoder.bind('geocodingComplete geocodingError geocodingCanceled', function () {
      if (this.model.data) {
        this.model.data().refresh();
      }
    }, this);
    this.add_related_model(this.geocoder);
  },

  _createTable: function () {
    throw new Error('Method not migrated, check original implementation');
  },

  activated: function () {
    if (!this.tableView) {
      this._createTable();
      this.tableView.render();
      this.render();
    }
  },

  deactivated: function () {
    if (this.tableView) {
      this.tableView.clean();
      this.tableView = null;
      this.hasRenderedTableView = false;
    }
  },

  render: function () {
    // Since render should be idempotent (i.e. should not append the tableView twice when called multiple times)
    if (this.tableView && !this.hasRenderedTableView) {
      this.hasRenderedTableView = true;
      this.$el.append(this.tableView.el);
    }
    return this;
  }

});
