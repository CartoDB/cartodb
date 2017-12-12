var cdb = require('cartodb.js-v3');

var HeaderView = require('./header_view_static');
var VendorScriptsView = require('../common/vendor_scripts_view');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.panesTemplate = cdb.templates.getTemplate('show/views/panes');

    this._initModels();
    this._initViews();
  },

  _initModels: function () {
    this.basemaps = this.options.basemaps;
    this.baseLayers = this.options.baseLayers;
    this.config = this.options.config;
    this.mapdata = this.options.mapdata;
    this.userData = this.options.userData;
    this.vizdata = this.options.vizdata;
    this.assetsVersion = this.options.assetsVersion;
    this.user = this.options.user;
  },

  _initViews: function () {
    this.headerView = new HeaderView({
      vizdata: this.vizdata
    });
    this.addView(this.headerView);
    this.$el.append(this.headerView.render().el);

    this.$el.append(this.panesTemplate());

    this.tableView = new cdb.admin.TableEditorView({
      baseLayers: this.baseLayers,
      basemaps: this.basemaps,
      config: this.config,
      map_data: this.mapdata,
      user_data: this.userData,
      vis_data: this.vizdata
    });

    window.table = this.tableView;
    window.table_router = new cdb.admin.TableRouter(this.tableView);

    if (!Backbone.History.started) {
      Backbone.history.start({
        pushState: true,
        root: cdb.config.prefixUrlPathname() + '/'
      });
    }

    this.vendorScriptsView = new VendorScriptsView({
      assetsVersion: this.assetsVersion,
      config: this.config,
      user: this.user
    });
    this.$el.append(this.vendorScriptsView.render().el);
    this.addView(this.vendorScriptsView);
  },

  clean: function () {
    window.table = null;
    window.table_router = null;
    cdb.core.View.prototype.clean.call(this);
  }
});
