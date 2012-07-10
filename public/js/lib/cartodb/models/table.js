
/**
 * models for cartodb admin
 */

(function() {

  /**
   * current user running app
   */
  cdb.admin.User = Backbone.Model.extend({});


  cdb.admin.Column = Backbone.Model.extend({

    idAttribute: 'name',

    url: function() {
      return '/api/v1/tables/' + this.table.get('name') + '/columns/' + this.get('name');
    },

    initialize: function() {
      this.table = this.get('table');
      if(!this.table) {
        throw new Exception("you should specify a table model");
      }
      this.unset('table', { silent: true });
    }

  });



  /**
   * contains information about the table, not the data itself
   */
  cdb.admin.CartoDBTableMetadata = cdb.ui.common.TableProperties.extend({

    initialize: function() {
      this.bind('change:schema', this._prepareSchema, this);
      this._prepareSchema();
    },

    urlRoot: function() {
      return '/api/v1/tables/';
    },

    _prepareSchema: function() {
      var self = this;
      this._columnType = {};
      _(this.get('schema')).each(function(s) {
        self._columnType[s[0]] = s[1];
      });
    },

    _getColumn: function(columnName) {
      if(this._columnType[columnName] === undefined) {
        throw new Exception("the column does not exists");
      }
      var c = new cdb.admin.Column({
        table: this,
        name: columnName,
        type: this._columnType[columnName]
      });
      return c;
    },

    deleteColumn: function(columnName) {
      var c = this._getColumn(columnName);
      c.destroy();
    },

    renameColumn: function(columnName, newName) {
      var c = this._getColumn(columnName);
      c.set({
        new_name: newName,
        old_name: c.get('name')
      });
      c.save();
    },

    changeColumnType: function(columnName, newType) {
      var c = this._getColumn(columnName);
      c.set({ type: newType});
      c.save();
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

  /**
   * tables available for given user
   * usage:
   * var tables = new cbd.admin.Tables()
   * tables.fetch();
   */
  cdb.admin.Tables = Backbone.Collection.extend({

    model: cdb.admin.CartoDBTableMetadata,

    url: function() {
      //TODO: use current host
      //var name = this.options.user.get('name');
      return '/api/v1/tables';
    },

    parse: function(response) {
      return response.tables;
    },

    initialize: function() {
    },

    create: function(m) {
      Backbone.Collection.prototype.create.call(this, m, {wait: true});
    }
  });

})();
