/**
 *  entry point for table
 */


$(function() {

    var Table = cdb.core.View.extend({
        el: document.body,

        initialize: function() {

          this._initModels();
          this._initViews();

          this.table.fetch();
          this.columns.fetch();
        },

        _initModels: function() {
          this.table = new cdb.admin.CartoDBTableMetadata({
            name: table_name
          });
          this.columns = this.table.data();
        },

        _initViews: function() {
          this.tableView = new cdb.admin.TableView({
            dataModel: this.columns,
            model: this.table
          });

          this.$('.table').append(this.tableView.render().el);
        }
    });

    var TableRouter = Backbone.Router.extend({

        routes: {
            '/': 'index'
        },

        index: function() {
        }

    });

    cdb.init(function() {
      var table = new Table();
      var router = new TableRouter();
      // expose to debug
      window.table = table;
    });

});
