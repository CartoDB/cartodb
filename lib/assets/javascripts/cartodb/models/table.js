
/**
 * models for cartodb admin
 */

(function() {

  cdb.admin.Column = Backbone.Model.extend({

    idAttribute: 'name',

    urlRoot: function() {
      return '/api/v1/tables/' + this.table.get('name') + '/columns/';
    },

    initialize: function() {
      this.table = this.get('table');
      if(!this.table) {
        throw "you should specify a table model";
      }
      this.unset('table', { silent: true });
    },

    toJSON: function() {
      var c = _.clone(this.attributes);
      // this hack is created to create new column
      // if you set _name instead name backbone does not get
      // it as idAttribute so launch a POST instead of a PUT
      if(c._name) {
        c.name = c._name;
        delete c._name;
      }
      return c;
    }


  });


  /**
   * contains information about the table, not the data itself
   */
  cdb.admin.CartoDBTableMetadata = cdb.ui.common.TableProperties.extend({

    initialize: function() {
      _.bindAll(this, 'notice');
      this.bind('change:schema', this._prepareSchema, this);
      this._prepareSchema();
      this.sqlView = null;
      this.data();
    },

    urlRoot: function() {
      return '/api/v1/tables/';
    },

    notice: function(msg, type, timeout) {
      this.trigger('notice', msg, type, timeout);
    },

    error: function(msg, resp) {
      var err =  resp && JSON.parse(resp.responseText).errors[0];
      this.trigger('notice', msg + " " + err, 'error');
    },

    _prepareSchema: function() {
      var self = this;
      this._columnType = {};
      _(this.get('schema')).each(function(s) {
        self._columnType[s[0]] = s[1];
      });
    },

    columnNames: function() {
      return _(this.get('schema')).pluck(0);
    },

    nonReservedColumnNames: function() {
      var self = this;
      return _.filter(this.columnNames(), function(c) {
        return !self.isReservedColumn(c);
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

    getColumnType: function(columnName) {
      var c = this._getColumn(columnName);
      return c.get('type');
    },

    addColumn: function(columnName, columnType) {
      var self = this;
      var c = new cdb.admin.Column({
        table: this,
        _name: columnName,
        type: columnType || 'string'
      });
      this.notice('adding new column');
      c.save(null, {
          success: function() {
            self.trigger('columnDelete', columnName);
            self.fetch();
          },
          error: function(e, resp) {
            self.error('error adding column', resp);
          },
          wait: true
      });
    },

    deleteColumn: function(columnName) {
      var self = this;
      var c = this._getColumn(columnName);
      this.notice('deleting column');
      c.destroy({
          success: function() {
            self.trigger('columnDelete', columnName);
            self.fetch();
          },
          error: function(e, resp) {
            self.error('error deleting column', resp);
          },
          wait: true
      });
    },

    renameColumn: function(columnName, newName) {
      var self = this;
      var c = this._getColumn(columnName);
      var oldName = c.get('name');
      c.set({
        new_name: newName,
        old_name: c.get('name')
      });
      this.notice('renaming column');
      c.save(null,  {
          success: function() {
            self.trigger('columnRename', newName, oldName);
            self.fetch();
          },
          error: function(e, resp) {
            cdb.log.error("can't rename column");
            self.error('error renaming column', resp);
          },
          wait: true
      });
    },

    changeColumnType: function(columnName, newType) {
      var self = this;
      var c = this._getColumn(columnName);
      c.set({ type: newType});
      this.notice('changing column type');
      c.save(null, {
          success: function() {
            self.fetch();
          },
          error: function(e, resp) {
            self.error('error chaging column ttype', resp);
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
      if(this.sqlView) {
        return this.sqlView;
      }
      return this._data;
    },


    useSQLView: function(view) {
      var self = this;
      var data = this.data();

      if(this.sqlView) {
        this.sqlView.unbind(null, null, this);
        this.sqlView.unbind(null, null, this._data);
      }

      // reset previous
      if(!view && this.sqlView) {
        this.sqlView.table = null;
      }

      this.sqlView = view;

      if(view) {
        this._data.unlinkFromSchema();
        view.bind('reset', function() {
          self.set({ schema: view.schemaFromData()});
          if(view.modify_rows) {
            self.useSQLView(null);
          }
        }, this);
        // swicth source data
        this.dataModel = this.sqlView;
        view.table = this;
      } else {
        this._data.linkToSchema();
        this.dataModel = this._data;
        // get the original schema
        this.fetch();
      }
      this.trigger('change:dataSource', this.dataModel, this);
    },

    isInSQLView: function() {
      return this.sqlView ? true: false;
    },

    /**
     * replace fetch functionally to add some extra call for logging
     * it can be used in the same way fetch is
     */
    fetch: function(opts) {
      var self = this;
      this.notice('loading table', 0, 0);
      opts = opts || {};
      var old_success = opts && opts.success;
      opts.success = function() {
        old_success && old_success();
        self.notice('loaded');
      };
      Backbone.Model.prototype.fetch.call(this, opts);
    },

    /**
     * return true if the sql query alters table schema in some way
     */
    alterTable: function(sql) {
      return sql.search(/alter/i) !== -1   ||
             sql.search(/drop/i)  !== -1;
    },

    /**
     * return true if the sql query alters table data
     */
    alterTableData: function(sql) {
      return this.alterTable(sql)       ||
             sql.search(/insert/i) !== -1  ||
             sql.search(/update/i) !== -1  ||
             sql.search(/delete/i) !== -1;
    },

    isReservedColumn: function(c) {
      return cdb.admin.Row.isReservedColumn(c);
    },

    /**
     * when a table is linked to a infowindow each time a column
     * is renamed or removed the table pings to infowindow to remove
     * or rename the fields
     */
    linkToInfowindow: function(infowindow) {
      this.bind('columnRename', function(oldName, newName) {
        if(infowindow.containsField(oldName)) {
          infowindow.removeField(oldName);
          infowindow.addField(newName);
        }
      }, infowindow);
      this.bind('columnDelete', function(oldName, newName) {
        infowindow.removeField(oldName);
      }, infowindow);
    },

    /**
     * when we do a PUT with latitude_column and longitude_column
     * the backend will create the_geom using those two columns
     */
    geocode_using: function(lat_column, lon_column) {
      this.save({
        latitude_column: lat_column,
        longitude_column: lon_column
      }, {
        success: function() {
          // when finish fetch the data again
          this.data().fetch();
        },
        error: function() {
          //TODO: notice user
        },
        wait: true
      });
    }

  }, {
    /**
     * creates a new table from query
     * the called is responsable of calling save to create
     * the table in the server
     */
    createFromQuery: function(name, query) {
      return new cdb.admin.CartoDBTableMetadata({
        from_query: query,
        name: name
      });
    }
  });

  cdb.admin.Row = Backbone.Model.extend({


    urlRoot: function() {
      var table = this.table || this.collection.table;
      if(!table) {
        cdb.log.error("row has no table assined");
      }
      return '/api/v1/tables/' + table.get('name') + '/records/';
    },

    toJSON: function() {
      var attr = _.clone(this.attributes);
      // remove read-only attributes
      delete attr['updated_at'];
      delete attr['created_at'];
      return attr;
    },

    isGeomLoaded: function() {
      var geojson = this.get('the_geom');
      return geojson !== 'GeoJSON';
    }

  }, {
    RESERVED_COLUMNS: 'cartodb_id created_at updated_at'.split(' '),
    isReservedColumn: function(c) {
      return _(cdb.admin.Row.RESERVED_COLUMNS).indexOf(c) !== -1;
    }
  });


  cdb.admin.CartoDBTableData = cdb.ui.common.TableData.extend({

    model: cdb.admin.Row,

    initialize: function(models, options) {
      this.table = options.table;
      this.model.prototype.idAttribute = 'cartodb_id';
      this.initOptions();
      this.linkToSchema();
      this.filter = null;
      this._fetching = false;
    },

    initOptions: function() {
      var self = this;
      this.options = new Backbone.Model({
        rows_per_page:40,
        page: 0,
        mode: 'asc',
        order_by: 'cartodb_id',
        filter_column: '',
        filter_value: ''
      });
      this.options.bind('change', function() {
        if(self._fetching) {
          return;
        }
        self._fetching = true;
        opt = {};
        var previous = this.options.previous('page');

        if(this.options.hasChanged('page')) {
          opt.add = true;
          opt.changingPage = true;
          // if user is going backwards insert new rows at the top
          if(previous > this.options.get('page')) {
            opt.at = 0;
          }
        }

        opt.success = function(_coll, resp) {
          if(resp.rows && resp.rows.length !== 0) {
            if(opt.changingPage) {
              self.trigger('newPage', self.options.get('page'), opt.at === 0? 'up': 'down');
            }
          } else {
            // no data so do not change the page
            self.options.set({page: previous});//, { silent: true });
          }
          self.trigger('endLoadingRows');
          self._fetching = false;
        };

        opt.error = function() {
          cdb.log.error("there was some problem fetching rows");
          self.trigger('endLoadingRows');
          self._fetching = false;
        };

        self.trigger('loadingRows', opt.at === 0 ? 'up': 'down');
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
      // when the query modifies the data modified flag is true
      this.modify_rows = d.modified;
      return d.rows;
    },

    _createUrlOptions: function() {
      return _(this.options.attributes).map(function(v, k) { return k + "=" + encodeURIComponent(v); }).join('&');
    },

    url: function() {
      var u = '/api/v1/tables/' + this.table.get('id') + '/records';
      u += "?" + this._createUrlOptions();
      return u;
    },

    setOptions: function(opt) {
      this.options.set(opt);
    },

    isFetchingPage: function() {
      return this._fetching;
    },

    setPage: function(p) {
      console.log("page: " + p);
      if(!this._fetching && p >= 0) {
        this.setOptions({page: p});
      }
    },

    getPage: function(p) {
      return this.options.get('page');
    },

    addRow: function(opts) {
      opts = opts || {};
      _.extend(opts, { wait: true });
      this.create(null, opts);
    },

    /**
     * return a model row
     */
    getRow: function(id) {
      var r = new cdb.admin.Row({cartodb_id: id});
      r.table = this.table;
      return r;
    },

    getRowAt: function(index) {
      var r = this.at(index);
      r.table = this.table;
      return r;
    },

    deleteRow: function(row_id) {
    },

    isReadOnly: function() {
      return false;
    },

    quartiles: function(nslots, column, callback, error) {
      var tmpl = _.template('SELECT quartile, max(<%= column %>) as maxAmount FROM (SELECT <%= column %>, ntile(<%= slots %>) over (order by <%= column %>) as quartile FROM <%= table_name %> WHERE <%= column %> IS NOT NULL) x GROUP BY quartile ORDER BY quartile');
      this._sqlQuery(tmpl({
        slots: nslots,
        table_name: this.table.get('name'),
        column: column
      }), callback, error);
    },

    _sqlQuery: function(sql, callback, error) {
      var s = encodeURIComponent(sql)
      $.ajax({
        url: '/api/v1/queries/?sql=' + s,
        success: function(data) {
          callback(_(data.rows).pluck('maxamount'));
        },
        error: error
      });
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
      //cdb.admin.CartoDBTableData.prototype.initialize.call(this, models, options);
      this.initOptions();
      if(options && options.sql) {
        this.setSQL(options.sql);
      }
      this.bind('reset', function() {
        console.log("sql reset");
      });
      this.bind('add', function() {
        console.log("sql add");
      });
    },

    setSQL: function(sql) {
      // reset options whiout changing raising a new fetchs
      this.options.set({
        page: 0,
        mode: 'asc',
        order_by: 'cartodb_id',
        filter_column: '',
        filter_value: ''
      }, { silent: true} );

      this.options.set({ sql :sql });
    },

    getSQL: function() {
      return this.options.get('sql');
    },

    schemaFromData: function() {
      var self = this;
      var schema = [];
      if(self.size()) {
        schema = _(self.models[0].attributes).map(function(k, v) {
           return [v, self.UNDEFINED_TYPE_COLUMN];
        });
      }
      return schema;
    },

    url: function() {
      var u = '/api/v1/queries/';
      u += "?" + this._createUrlOptions();
      cdb.log.debug("fetching " + u);
      return u;
    },

    isReadOnly: function() {
      return true;
    }

    /*url: function() {
      if(!this.sql) {
        throw "sql must be provided";
      }
      return '/api/v1/queries?sql=' +
        encodeURIComponent(this.sql) +
        '&limit=20&rows_per_page=40&page=0'
    }*/

  });

  /**
   * tables available for given user
   * usage:
   * var tables = new cbd.admin.Tables()
   * tables.fetch();
   */
  cdb.admin.Tables = Backbone.Collection.extend({

    model: cdb.admin.CartoDBTableMetadata,

    initialize: function() {
      this.options = new Backbone.Model({
        tag_name  : "",
        q         : "",
        page      : 1,
        per_page  : 10
      });

      this.total_entries = 0;

      this.options.bind("change", this._changeOptions, this);
      this.bind("reset",          this._checkPage, this);
      this.bind("add remove",     this._fetchAgain, this);
    },

    getTotalPages: function() {
      return Math.ceil(this.total_entries / this.options.get("per_page"));
    },

    _fetchAgain: function() {
      this.fetch();
    },

    _checkPage: function() {
      var total = this.getTotalPages();
      var page = this.options.get('page') - 1;
      if (this.options.get("page") > total ) {
        this.options.set({"page": total + 1});
      } else if (this.options.get("page") < 1) {
        this.options.set({"page": 1});
      }
    },

    _createUrlOptions: function() {
      return _(this.options.attributes).map(function(v, k) { return k + "=" + encodeURIComponent(v); }).join('&');
    },

    url: function() {
      var u = '/api/v1/tables/';
      u += "?" + this._createUrlOptions();
      return u;
    },

    parse: function(response) {
      this.total_entries = response.total_entries;
      return response.tables;
    },

    _changeOptions: function() {
      this.fetch();
    },

    create: function(m) {
      Backbone.Collection.prototype.create.call(this, m, {wait: true});
    },

    fetch: function(opts) {
      this.trigger("loading", this);
      Backbone.Collection.prototype.fetch.call(this,opts);
    }
  });

})();
