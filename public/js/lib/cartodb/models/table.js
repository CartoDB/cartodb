
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
        throw "you should specify a table model";
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
      this.sqlView = null;
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
        throw "the column does not exists";
      }
      var c = new cdb.admin.Column({
        table: this,
        name: columnName,
        type: this._columnType[columnName]
      });
      return c;
    },

    deleteColumn: function(columnName) {
      var self = this;
      var c = this._getColumn(columnName);
      c.destroy({
          success: function() {
            self.fetch();
          },
          wait: true
      });
    },

    renameColumn: function(columnName, newName) {
      var self = this;
      var c = this._getColumn(columnName);
      c.set({
        new_name: newName,
        old_name: c.get('name')
      });
      c.save(null,  {
          success: function() {
            self.fetch();
          },
          error: function() {
            cdb.log.error("can't rename column");
          },
          wait: true
      });
    },

    changeColumnType: function(columnName, newType) {
      var self = this;
      var c = this._getColumn(columnName);
      c.set({ type: newType});
      c.save(null, {
          success: function() {
            self.fetch();
          },
          wait: true
      });
    },

    data: function() {
      if(this._data === undefined) {
        this._data = new cdb.admin.CartoDBTableData(null, {
          table: this
        });
      }
      return this._data;
    },


    useSQLView: function(view) {
      var self = this;
      var data = this.data();

      if(this.sqlView) {
        this.sqlView.unbind(null, null, this);
        this.sqlView.unbind(null, null, data);
      }

      this.sqlView = view;

      if(view) {
        data.unlinkFromSchema();
        view.bind('reset', function() {
          data.reset(view.models);
          self.set({ schema: view.schemaFromData()});
        }, data);
      } else {
        data.linkToSchema();
        this.fetch();
      }
      this.trigger('change:sqlView', this);
    },

    /**
     * return true if the sql query alters table schema in some way
     */
    alterTable: function(sql) {
      return sql.search(/alter/i) !== -1   ||
             sql.search(/drop/i)  !== -1
    },

    /**
     * return true if the sql query alters table data
     */
    alterTableData: function(sql) {
      return this.alterTable(sql)       ||
             sql.search(/insert/i) !== -1  ||
             sql.search(/update/i) !== -1  ||
             sql.search(/delete/i) !== -1
    }

  });

  cdb.admin.Row = Backbone.Model.extend({

    initialize: function() {
      /*
      this.table = this.get('table');
      if(!this.table) {
        throw new Exception("you should specify a table model");
      }
      this.unset('table', { silent: true });
      */
    },

/*
    urlRoot: function() {
      return '/api/v1/tables/' + this.table.get('name') + '/records';
    }
    */

  });


  cdb.admin.CartoDBTableData = cdb.ui.common.TableData.extend({

    model: cdb.admin.Row,

    options: new Backbone.Model({
      rows_per_page:40,
      page: 0,
      mode: 'asc',
      order_by: 'cartodb_id',
      filter_column: '',
      filter_value: ''
    }),

    initialize: function(models, options) {
      var self = this;
      this.table = options.table;
      this.model.prototype.idAttribute = 'cartodb_id';
      // dont bind directly to fetch because change send
      // options that are use in fetch
      this.linkToSchema();
      this.filter = null;
      this.options.bind('change', function() {
        opt = {};
        if(this.options.hasChanged('page')) {
          opt.add = true;
          opt.changingPage = true;
        }
        opt.success = function() {
           if(opt.changingPage) {
             self.trigger('newPage', self.options.get('page'));
           }
        };
        opt.error = function() {
          cdb.log.error("there was some problem fetching rows");
        };
        this.fetch(opt);
      }, this);
    },

    /**
     * when the schema changes the data is not refetch
     */
    unlinkFromSchema: function() {
      this.table.unbind('change', null, this);
    },

    /**
     * when the schame changes the data is fetch again
     */
    linkToSchema: function() {
      var self = this;
      this.table.bind('change', function() { self.fetch(); }, this);
    },

    parse: function(d) {
      return d.rows;
    },

    _createUrlOptions: function() {
      return _(this.options.attributes).map(function(v, k) { return k + "=" + v; }).join('&');
    },

    url: function() {
      var u = '/api/v1/tables/' + this.table.get('id') + '/records';
      u += "?" + this._createUrlOptions();
      return u;
    },

    setOptions: function(opt) {
      this.options.set(opt);
    },

    setPage: function(p) {
      this.setOptions({page: p});
    },

    getPage: function(p) {
      return this.options.get('page');
    },

    addRow: function() {
      this.create(null, { wait: true });
    },

    deleteRow: function(row_id) {
    }

  });

  /**
   * contains data for a sql view
   * var s = new cdb.admin.SQLViewData({ sql : "select...." });
   * s.fetch();
   */
  cdb.admin.SQLViewData = cdb.admin.CartoDBTableData.extend({

    UNDEFINED_TYPE_COLUMN: 'undefined',

    initialize: function(models, options) {
      this.model.prototype.idAttribute = 'cartodb_id';
      this.sql = options ? options.sql: null;
    },

    setSQL: function(sql) {
      this.sql = sql;
    },

    schemaFromData: function() {
      var self = this;
      var schema = _(self.models[0].attributes).map(function(k, v) {
         return [v, self.UNDEFINED_TYPE_COLUMN];
      });
      return schema;
    },

    url: function() {
      if(!this.sql) {
        throw "sql must be provided";
      }
      return '/api/v1/queries?sql=' +
        encodeURIComponent(this.sql) +
        '&limit=20&rows_per_page=40&page=0'
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
