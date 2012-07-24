/**
 *  entry point for dashboard
 */


$(function() {

  var Dashboard = cdb.core.View.extend({

    el: document.body,

    events: {
      'click':  'onClickOut'
    },

    initialize: function() {
      this._initModels();
      this._initViews();
      this.tables.fetch();
    },

    _initModels: function() {
      this.tables = new cdb.admin.Tables();
      this.user = new cdb.admin.User({ id : userid });
    },

    _initViews: function() {
      // Table list
      this.tableList = new cdb.admin.dashboard.TableList({
        el: this.$('#tablelist'),
        model: this.tables
      });

      // User data
      this.tableStats = new cdb.admin.dashboard.TableStats({
        el: this.$('div.subheader'),
        tables: this.tables,
        model: this.user
      });      

      // User menu
      var user_menu = this.user_menu = new cdb.admin.UserMenu({
        target: 'a.account',
        model: {username: username},
        template_base: 'dashboard/views/settings_item'
      });
      cdb.god.bind("closeDialogs", user_menu.hide, user_menu);
      this.$el.append(this.user_menu.render().el);

      // Background Importer
      var bkg_importer = this.bkg_importer = new cdb.ui.common.BackgroundImporter({
        template_base: 'common/views/background_importer'
      });
      this.$el.append(this.bkg_importer.render().el);

      // Create new table view
      var createTable = this.createTable = new cdb.admin.dashboard.CreateTable({
        el: this.$('aside div.head'),
        importer: bkg_importer,
        tables: this.tables,
        model: this.user
      });

      // Tipsy
      this.$el.find("a.tooltip").tipsy({gravity: 's', fade:true, live:true});
    },

    onClickOut: function(ev) {
      cdb.god.trigger("closeDialogs");
    }
  });

  var DashboardRouter = Backbone.Router.extend({

    routes: {
      '/': 'index'
    },

    index: function() {}
  });

  cdb.init(function() {
    var dashboard = new Dashboard();
    var router = new DashboardRouter();
    // expose to debug
    window.dashboard = dashboard;
  });

});
