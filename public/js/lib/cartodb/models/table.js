
/**
 * models for cartodb admin
 */

(function() {

  /**
   * current user running app
   */
  cdb.admin.User = Backbone.Model.extend({});


  cdb.admin.Column = Backbone.Model.extend({

    url: function() {
      return '/api/v1/tables/' + this.table.get('name') + '/' + this.get('name');
    },

    initialize: function() {
      this.table = this.get('table');
      if(!this.table) {
        throw new Exception("you should specify a table model");
      }
      this.unset('table', { silent: true });
    },

  });
  /**
   * contains table meta information like name
   * rows and so on
   * table api:
   *
   * delete a column: DELETE /api/v1/tables/_2/columns/color
   * rename column: PUT /api/v1/tables/_2/columns/name
   *    params: new_name:name2
   *    index:3
   */
  cdb.admin.Table = cdb.ui.common.TableProperties.extend({
    url: function() {
      //TODO: use current host
      //var name = this.options.user.get('name');
      return '/api/v1/tables';
    },
    //idAttribute: 'name'
    deleteColumn: function(columnName) {
      var c = new cdb.admin.Column({
        table: this,
      })
      c.delete();
    },

    renameColumn: function(columnName, newName) {
    },

    changeColumnType: function(columnName, newType) {
    }
  });

  /**
   * tables available for given user
   * usage:
   * var tables = new cbd.admin.Tables()
   * tables.fetch();
   */
  cdb.admin.Tables = Backbone.Collection.extend({

    model: cdb.admin.Table,

    url: function() {
      //TODO: use current host
      //var name = this.options.user.get('name');
      return '/api/v1/tables';
    },

    parse: function(response) {
      return response.tables;
    },

    initialize: function() {
    }
  });
  
  cdb.admin.CartoDBTableMetadata = cdb.ui.common.TableProperties.extend({
      url: function() {
        return '/api/v1/tables/' + this.get('name');
      },

      data: function() {
        if(this._data === undefined) {
          this._data = new cdb.admin.CartoDBTableData(null, {
            name: this.get('name')
          });
        }
        return this._data;
      }
  });

  cdb.admin.CartoDBTableData = cdb.ui.common.TableData.extend({

    initialize: function(models, options) {
      this.table = options.name;
      this.model.prototype.idAttribute = 'cartodb_id';
    },

    parse: function(d) {
      return d.rows;
    },

    url: function() {
      return '/api/v1/tables/' + this.table + '/records';
    }

  });

})();
