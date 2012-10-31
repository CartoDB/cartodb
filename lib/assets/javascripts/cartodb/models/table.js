
/**
 * models for cartodb admin
 */

(function() {

  cdb.admin.Column = cdb.core.Model.extend({

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
    },

  });


  /**
   * contains information about the table, not the data itself
   */
  cdb.admin.CartoDBTableMetadata = cdb.ui.common.TableProperties.extend({

    currentLoading: 0, // class variable (shared). I'm still not sure if this is messy as hell or powerfull as a transformer

    _TEXTS: {
      columnDeleted: 'Your column has been deleted',
      columnDeleting: 'Deleting your column',
      columnAdded: 'Your column has been added',
      columnAdding: 'Adding new column'
    },



    initialize: function() {
      _.bindAll(this, 'notice');
      this.bind('change:schema', this._prepareSchema, this);
      this._prepareSchema();
      this.sqlView = null;
      this.data();
      this.bind('error', function(e, resp) {
        this.error('', resp);
      }, this);
      this._data.bind('error', function(e, resp) {
        this.notice('error loading rows', 'error', 5000);
      }, this);
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

    containsColumn: function(name) {
      return _.contains(this.columnNames(), name);
    },

    columnNamesByType: function(type) {
      var t = _(this.get('schema')).filter(function(c) {
        return c[1] == type;
      });
      return _(t).pluck(0);
    },

    // return the current column types in an array
    // the values inside the array can be:
    //  'point', 'line', 'polygon'
    geomColumnTypes: function() {
      var types = this.get('geometry_types');
      var geomTypes = [];
      var _map = {
        'st_multipolygon': 'polygon',
        'st_polygon': 'polygon',
        'st_multilinestring': 'line',
        'st_linestring': 'line',
        'st_multipoint': 'point',
        'st_point': 'point'
      };
      for(var t in types) {
        var type = types[t];
        // when there are rows with no geo type null is returned as geotype
        if(type) {
          var a = _map[type.toLowerCase()]
          if(a) {
            geomTypes.push(a)
          }
        }
      }
      return geomTypes;
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

    addColumn: function(columnName, columnType, callback) {
      var self = this;
      var c = new cdb.admin.Column({
        table: this,
        _name: columnName,
        type: columnType || 'string'
      });
      this.notice(self._TEXTS.columnAdding, 'load', 0);
      c.save(null, {
          success: function() {
            self.notice(self._TEXTS.columnAdded, 'info');
            self.trigger('columnDelete', columnName);
            self.fetch({silent: true});
            callback && callback();
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
      this.notice(self._TEXTS.columnDeleting, 'load', 0);
      c.destroy({
          success: function() {
            self.trigger('columnDelete', columnName);
            self.notice(self._TEXTS.columnDeleted, 'info');
            self.fetch({silent: true});
          },
          error: function(e, resp) {
            self.error('error deleting column', resp);
          },
          wait: true
      });
    },

    renameColumn: function(columnName, newName) {
      if(columnName == newName) return;
      var self = this;
      var c = this._getColumn(columnName);
      var oldName = c.get('name');
      c.set({
        new_name: newName,
        old_name: c.get('name')
      });
      this.notice('renaming column', 'load', 0);
      c.save(null,  {
          success: function() {
            self.notice('Column has been renamed', 'info');
            self.trigger('columnRename', newName, oldName);
            self.fetch({silent:true});
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
      if(this.getColumnType(columnName) == newType) return;
      c.set({ type: newType});
      this.notice('Changing column type', 'load', 0);
      c.save(null, {
          success: function() {
            self.notice('Column type has been changed', 'info');
            self.fetch({silent: true});
          },
          error: function(e, resp) {
            self.error('error chaging column ttype', resp);
          },
          wait: true
      });
    },

    data: function() {
      var self = this;
      if(this._data === undefined) {
        this._data = new cdb.admin.CartoDBTableData(null, {
          table: this
        });
        this.bindData();
      }
      if(this.sqlView) {
        return this.sqlView;
      }
      return this._data;
    },

    bindData: function(data) {
      var self = this;
      this.retrigger('reset', this._data, 'dataLoaded');
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
          self.set({ schema: view.schemaFromData(this.get('schema'))});
          if(view.modify_rows) {
            //self.useSQLView(null);
          }
        }, this);
        // listen for errors
        view.bind('error', function(e, resp) {
          this.notice('error loading rows', 'error', 5000);
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
      silent = opts? opts.silent : false;
      if(!silent) {
        this.notice('loading table', 'load', this, 0, 0);
      }
      $.when(this.elder('fetch')).done(function() {
        opts && opts.success && opts.success.old_success && opts.success.old_success();
        if(!silent) {
          self.notice('loaded');
        }
      }).fail(function(){
        if(!silent) {
          self.notice('error loading the table');
        }
      });

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
    },

    embedURL: function() {
      return "/tables/" + this.get('name') + "/embed_map"
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

  cdb.admin.Row = cdb.core.Model.extend({

    _CREATED_EVENT: 'created',
    _CREATED_EVENT: 'creating',
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
    _ADDED_ROW_TEXT: 'Row added correctly',
    _ADDING_ROW_TEXT: 'Adding a new row',

    model: cdb.admin.Row,

    initialize: function(models, options) {
      this.table = options ? options.table: null;
      this.model.prototype.idAttribute = 'cartodb_id';
      this.initOptions();
      if(this.table) {
        this.linkToSchema();
      }
      this.filter = null;
      this._fetching = false;
      this.pages = [];
      this.lastPage = false;
      this.bind('newPage', this.newPage, this);
      this.bind('reset', function() {
        var pages = Math.floor(this.size()/this.options.get('rows_per_page'))
        this.pages = [];
        for(var i = 0; i < pages; ++i) {
          this.pages.push(i);
        }
      }, this);
    },

    initOptions: function() {
      var self = this;
      this.options = new cdb.core.Model({
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
          self.trigger('endLoadingRows', self.options.get('page'), opt.at === 0? 'up': 'down');
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
      this.lastPage = false;
      if(d.rows.length < this.options.get('rows_per_page')) {
        this.lastPage = true;
      }
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

    loadPageAtTop: function() {
      if(!this._fetching) {
        var first = this.pages[0];
        if(first > 0) {
          this.options.set('page', first - 1);
        }
      }
    },

    loadPageAtBottom: function() {
      if(!this._fetching) {
        var last = this.pages[this.pages.length - 1];
        if(!this.lastPage) {
          this.options.set('page', last + 1);
        }
      }
    },

    /**
     * called when a new page is loaded
     * removes the models to max
     */
    newPage: function(currentPage, direction) {
       this.pages.push(currentPage);
       this.pages.sort();
       // remove blocks if there are more rows than allowed
       var rowspp = this.options.get('rows_per_page');
       var max_items = rowspp*4;
       if(this.size() > max_items) {
         if(direction == 'up') {
           // remove page from the bottom (the user is going up)
           this.pages.pop();
           this.remove(this.models.slice(max_items, this.size()));
         } else {
           // remove page from the top (the user is going down)
           this.pages.shift();
           this.remove(this.models.slice(0, rowspp));
         }
       }
    },

    /*setPage: function(p) {
      if(!this._fetching && p >= 0) {
        this.setOptions({page: p});
      }
    },

    getPage: function(p) {
      return this.options.get('page');
    },*/
    addRow: function(opts) {
      var self = this;
      this.table.notice(self._ADDING_ROW_TEXT, 'load', 0)
      var self = this;
      opts = opts || {};
      _.extend(opts, {
        wait: true,
        success: function() {
          self.table.notice(self._ADDED_ROW_TEXT)
        }
      });
      this.create(null, opts);
    },

    /**
     * creates a new row model in local, it is NOT serialized to the server
     */
    newRow: function(attrs) {
      r = new cdb.admin.Row(attrs);
      r.table = this.table;
      return r;
    },

    /**
     * return a model row
     */
    getRow: function(id) {
      var r = this.get(id);
      if(!r) {
        r = new cdb.admin.Row({cartodb_id: id});
      }
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
      }),
      function(data) {
        callback(_(data.rows).pluck('maxamount'));
      },
      error);
    },

    /**
     * call callback with the geometry bounds
     */
    geometryBounds: function(callback) {
      var tmpl = _.template('SELECT ST_XMin(ST_Extent(the_geom)) as minx,ST_YMin(ST_Extent(the_geom)) as miny, ST_XMax(ST_Extent(the_geom)) as maxx,ST_YMax(ST_Extent(the_geom)) as maxy from <%= table_name %>');
      this._sqlQuery(tmpl({
         table_name: this.table.get('name')
        }),
        function(result) {
           var coordinates = result.rows[0];

            var lon0 = coordinates.maxx;
            var lat0 = coordinates.maxy;
            var lon1 = coordinates.minx;
            var lat1 = coordinates.miny;

            var minlat = -85.0511;
            var maxlat =  85.0511;
            var minlon = -179;
            var maxlon =  179;

            var clampNum = function(x, min, max) {
              return x < min ? min : x > max ? max : x;
            };

            lon0 = clampNum(lon0, minlon, maxlon);
            lon1 = clampNum(lon1, minlon, maxlon);
            lat0 = clampNum(lat0, minlat, maxlat);
            lat1 = clampNum(lat1, minlat, maxlat);
            callback([ [lat0, lon0], [lat1, lon1]]);
        }
      );
    },

    _sqlQuery: function(sql, callback, error) {
      var s = encodeURIComponent(sql);
      $.ajax({
        url: '/api/v1/queries/?sql=' + s,
        success: callback,
        error: error
      });
    },

    getSQL: function() {
      return "select * from " + this.table.get('name');
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
      // depending on the sql the query is read only or not
      // for example, filter sql should allow edit cells and
      // remove rows
      this.readOnly = true;
      this.model.prototype.idAttribute = 'cartodb_id';
      // this.elder('initialize', models, options);
      cdb.admin.CartoDBTableData.prototype.initialize.call(this, models, options);
      //this.initOptions();
      if(options && options.sql) {
        this.setSQL(options.sql);
      }
    },

    _parseSQL: function(sql) {
      sql = sql.replace(/([^\\]){x}/g, '$10').replace(/\\{x}/g, '{x}')
      sql = sql.replace(/([^\\]){y}/g, '$10').replace(/\\{y}/g, '{y}')
      sql = sql.replace(/([^\\]){z}/g, '$10').replace(/\\{z}/g, '{z}')
      return sql
    },

    setSQL: function(sql, opts) {
      this.readOnly = true;
      // reset options whiout changing raising a new fetchs
      this.options.set({
        page: 0,
        mode: 'asc',
        order_by: 'cartodb_id',
        filter_column: '',
        filter_value: ''
      }, { silent: true} );

      this.options.set({ sql : sql ? this._parseSQL(sql): '' }, opts);
    },

    getSQL: function() {
      return this.options.get('sql');
    },

    /**
     * with the data from the rows fetch create an schema
     * if the schema from original table is passed the method
     * set the column types according to it
     * return an empty list if no data was fetch
     */
    schemaFromData: function(originalTableSchema) {
      var self = this;
      var schema = [];
      var oldSchema = {};
      _(originalTableSchema).each(function(v) {
        oldSchema[v[0]] = v[1];
      });
      if(self.size()) {
        schema = _(self.models[0].attributes).map(function(k, v) {
           var type = oldSchema[v];
           return [v, type || self.UNDEFINED_TYPE_COLUMN];
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
      return this.readOnly;
    },

    filterColumn: function(columnName, tableName, filter) {
      // filter table by column
      var tmpl = _.template("SELECT * from <%= table %> where <%= column %> ilike '%<%=filter%>'", {
        column: columnName,
        table: tableName,
        filter: filter
      });
      this.setSQL(tmpl);
      this.readOnly = false;


    },

    quartiles: function(nslots, column, callback, error) {
      var tmpl = _.template('SELECT quartile, max(<%= column %>) as maxAmount FROM (SELECT <%= column %>, ntile(<%= slots %>) over (order by <%= column %>) as quartile FROM (<%= sql %>) as _rambo WHERE <%= column %> IS NOT NULL) x GROUP BY quartile ORDER BY quartile');
      this._sqlQuery(tmpl({
        slots: nslots,
        sql: this.options.get('sql'),
        column: column
      }), callback, error);
    },

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
   * access to data using the api endpoint
   */
  cdb.admin.SQLViewDataAPI = cdb.admin.SQLViewData.extend({

    url: function() {
      var protocol = cdb.config.get("sql_api_endpoint") == 443 ? 'https': 'http';

      var u = protocol + "://" + cdb.config.get('sql_api_domain');
      u += ":" + cdb.config.get('sql_api_port');
      u += cdb.config.get('sql_api_endpoint');

      var o = _.clone(this.options.attributes);
      delete o.sql;
      o.q = this.options.get('sql');

      var params = _(o).map(function(v, k) {
        return k + "=" + encodeURIComponent(v);
      }).join('&');

      u += "?" + params;
      return u;
    },

    /**
     * do the call with jsonp to avoid CORS
     */
    fetch: function(opts) {
      opts = opts || {};
      opts.dataType = "jsonp";
      return cdb.admin.SQLViewData.prototype.fetch.call(this, opts);
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

    initialize: function() {
      this.options = new cdb.core.Model({
        tag_name  : "",
        q         : "",
        page      : 1,
        per_page  : 10
      });

      this.total_entries = 0;

      this.options.bind("change", this._changeOptions, this);
      this.bind("reset",          this._checkPage, this);
      this.bind("update",          this._checkPage, this);
      this.bind("add",     this._fetchAgain, this);
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

    remove: function(options) {
      this.elder('remove', options);
      this.total_entries--;
    },

    parse: function(response) {
      this.total_entries = response.total_entries;
      return response.tables;
    },

    _changeOptions: function() {
      var self = this;
      $.when(this.fetch()).done(function(){
        self.trigger('forceReload')
      });
    },

    create: function(m) {
      var dfd = $.Deferred();
      console.log('c1');
      Backbone.Collection.prototype.create.call(this,
        m,
        {
            wait: true,
            success: function() {
              console.log('c2');
              dfd.resolve();

            },
            error: function() {
              dfd.reject();
            }
        }
      );
      return dfd;
    },

    fetch: function(opts) {
      var dfd = $.Deferred();
      var self = this;
      this.trigger("loading", this);
      $.when(Backbone.Collection.prototype.fetch.call(this,opts)).done(function(res) {
        self.trigger('loaded');
        dfd.resolve();
      }).fail(function(res) {
        self.trigger('loadFailed');
        dfd.reject(res);
      });
      return dfd.promise();
    }
  });

})();
