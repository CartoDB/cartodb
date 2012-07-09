/**
 *  entry point for dashboard
 */


$(function() {

    var Dashboard = cdb.core.View.extend({

        el: document.body,

        events: {
          'click a[href=#create_new]': 'show_dialog'
        },


        initialize: function() {
          this._initModels();
          this._initViews();

          this.tables.fetch();
        },

        _initModels: function() {
          this.tables = new cdb.admin.Tables();
        },

        _initViews: function() {
          this.tableList = new cdb.admin.dashboard.TableList({
            el: this.$('.content > ul'),
            model: this.tables
          });

          // User settings
          // var settings = this.settings = new cdb.ui.common.Dropdown({
          //   target: 'a.account',
          //   model: {username: username},
          //   template_base: "dashboard/views/settings_item",
          //   onClick: function() {
          //     console.log("how does it look?");
          //   }
          // });
          // this.$el.append(this.settings.render().el);
        },

        show_dialog: function() {

          var MyDialog = cdb.ui.common.Dialog.extend({
            render_content: function() {
              return "my content";
            },
          })

          var dialog = new MyDialog({
              title: 'test',
              description: 'long description here',
              template_name: 'common/views/dialog_base',
              width: 500
          });

          this.$el.append(dialog.render().el);
          dialog.open();
        }
    });

    var DashboardRouter = Backbone.Router.extend({

        routes: {
            '/': 'index'
        },

        index: function() {
        }

    });

    cdb.init(function() {
      var dashboard = new Dashboard();
      var router = new DashboardRouter();
      // expose to debug
      window.dashboard = dashboard;
    });




});
