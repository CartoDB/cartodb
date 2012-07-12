
/**
 * menu bar sql module
 * this module is used to perform custom SQL queries on the table (and the map)
 */

cdb.admin.mod = cdb.admin.mod || {};

cdb.admin.mod.SQL = cdb.core.View.extend({

    buttonClass: 'sql_mod',
    type: 'tool',

    events: {
      'click button': 'applyQuery'
    },

    initialize: function() {
      this.template = this.getTemplate('table/menu_modules/views/sql');
      this.sqlView = new cdb.admin.SQLViewData();
    },

    render: function() {
      this.$el.append(this.template({}));
      return this;
    },

    applyQuery: function() {
      var sql = this.$('textarea').val();
      this.sqlView.setSQL(sql);
      this.model.useSQLView(this.sqlView);
      this.sqlView.fetch();
      //this.trigger('sqlQuery', sql);
    }

});
