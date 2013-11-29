
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
    sqlApiClass: cartodb.SQL,

    _TEXTS: {
      columnDeleted: 'Your column has been deleted',
      columnDeleting: 'Deleting your column',
      columnAdded: 'Your column has been added',
      columnAdding: 'Adding new column',
      tableGeoreferenced: 'Table georeferenced',
      tableGeoreferencing: 'Georeferencing table'
    },

    hiddenColumns: [
      'the_geom',
      'the_geom_webmercator',
      'cartodb_georef_status',
      'created_at',
      'updated_at',
      'cartodb_id'
    ],

    initialize: function() {
      _.bindAll(this, 'notice');
      this.bind('change:schema', this._prepareSchema, this);
      this._prepareSchema();
      this.sqlView = null;
      this.synchronization = new cdb.admin.TableSynchronization();
      this.synchronization.linkToTable(this);
      this.synchronization.bind('change:id', function isSyncChanged() {
        this.trigger('change:isSync', this, this.synchronization.isSync());
      }, this);
      this.data();
      this.bind('error', function(e, resp) {
        this.error('', resp);
      }, this);
      this._data.bind('error', function(e, resp) {
        this.notice('error loading rows', 'error', 5000);
      }, this);
      this.retrigger('change', this._data, 'data:changed');
      this.retrigger('saved', this._data, 'data:saved');
    },

    urlRoot: function() {
      return '/api/v1/tables/';
    },

    // use the name as the id since the api works
    // in the same way to table name and id
    parse: function(resp, xhr) {
      if(resp.name) {
        resp.id = resp.name;
      }
      if (this.isInSQLView()) {
        delete resp.schema;
        delete resp.geometry_types;
      }
      return resp;
    },

    notice: function(msg, type, timeout) {
      this.trigger('notice', msg, type, timeout);
    },

    isReadOnly: function() {
      return this.data().isReadOnly() || this.synchronization.isSync();
    },

    isSync: function() {
      return this.synchronization.isSync();
    },

    sortSchema: function(priorities) {
      priorities = priorities || {
        'cartodb_id': 100,
        'the_geom': 99,
        'created_at': 1,
        'updated_at': 0,
        '__default__': 2
      };
      var sc = _.clone(this.get('schema'));
      sc.sort(function(a, b) {
        function priority(v) {
          var pa = priorities[v];
          return pa === undefined ? priorities['__default__']: pa;
        }
        return priority(b[0]) - priority(a[0]);
      });
      this.set('schema', sc);
    },

    error: function(msg, resp) {
      var err =  resp && JSON.parse(resp.responseText).errors[0];
      this.trigger('notice', msg + ": " + err, 'error');
    },

    _prepareSchema: function() {
      var self = this;
      this._columnType = {};

      _(this.get('schema')).each(function(s) {
        self._columnType[s[0]] = s[1];
      });

      if (!this.isInSQLView()) {
        self.set('original_schema', self.get('schema'));
      }
    },

    columnNames: function(sc) {
      sc = sc || 'schema'
      return _(this.get(sc)).pluck(0);
    },

    containsColumn: function(name) {
      return _.contains(this.columnNames(), name);
    },

    columnNamesByType: function(type, sc) {
      sc = sc || 'schema';
      var t = _(this.get(sc)).filter(function(c) {
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

    /**
     *  Adding a new geometry type to the table
     *  @param geom type {st_polygon, st_point,...}
     *  @param boolean {if you need to silent the model change, by default false}
     */
    addGeomColumnType: function(t,s) {
      if(!t) return;
      var types = _.clone(this.get('geometry_types')) || [];
      if(!_.contains(types, t)) {
        types.push(t);

        this.set({
          'geometry_types': types
        },{
          silent: s || false
        });
      }
    },

    nonReservedColumnNames: function() {

      var self = this;
      return _.filter(this.columnNames(), function(c) {
        return !self.isReservedColumn(c);
      });
    },

    _getColumn: function(columnName) {
      if(this._columnType[columnName] === undefined) {
        return
        // throw "the column does not exists";
      }
      var c = new cdb.admin.Column({
        table: this,
        name: columnName,
        type: this._columnType[columnName]
      });
      return c;
    },

    getColumnType: function(columnName, sc) {
      sc = sc || 'schema';
      var t = _(this.get(sc)).filter(function(c) {
        return c[0] == columnName;
      });
      if(t.length > 0)
        return t[0][1];
      return;
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
            self.trigger('columnAdd', columnName);
            self.fetch();
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
            self.fetch();
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
            self.fetch();
          },
          error: function(e, resp) {
            cdb.log.error("can't rename column");
            self.error('error renaming column', resp);
          },
          wait: true
      });
    },

    isTypeChangeDestructive: function(columnName, newType) {
      var columnType = this.getColumnType(columnName);

      var destructiveMatrix = {
        "string": {
          "string": false,
          "number": true,
          "date": true,
          "boolean": true,
        },
        "number": {
          "string": false,
          "number": false,
          "date": true,
          "boolean": true,
        },
        "date": {
          "string": false,
          "number": true,
          "date": false,
          "boolean": true,
        },
        "boolean": {
          "string": false,
          "number": false,
          "date": true,
          "boolean": false,
        },
      }
      return destructiveMatrix[columnType][newType]
    },

    changeColumnType: function(columnName, newType) {
      var self = this;
      var c = this._getColumn(columnName);

      if(this.getColumnType(columnName) == newType) {
        return;
      }
      this.saveNewColumnType(c, newType);
    },

    saveNewColumnType: function(column, newType) {
      var self = this;
      column.set({ type: newType});
      this.notice('Changing column type', 'load', 0);
      column.save(null, {
          success: function() {
            self.notice('Column type has been changed', 'info');
            self.trigger('typeChanged', newType); // to make it testable
            self.fetch();
          },
          error: function(e, resp) {
            self.trigger('typeChangeFailed', newType, e); // to make it testable
            self.error('error changing column type', resp);
          },
          wait: true
      });
    },

    /**
     * returns the original data for the table not the current applied view
     */
    originalData: function() {
      return this._data;
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
      if(this._data && !this._data.bindedReset) {

        this.retrigger('reset', this._data, 'dataLoaded');
        this.retrigger('add', this._data, 'dataAdded');
        this._data.bindedReset = true;

      }
      if(this.sqlView && !this.sqlView.bindedReset) {
        this.retrigger('reset', this.sqlView, 'dataLoaded');
        this.retrigger('add', this.sqlView, 'dataAdded');
        this.sqlView.bindedReset = true;
      }

    },

    useSQLView: function(view, options) {
      options = options || {};
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
      this.bindData();

      if(view) {
        this._data.unlinkFromSchema();
        view.bind('reset', function() {
          if(!view.modify_rows) {
            this.set({ 
              schema: view.schemaFromData(this.get('schema')),
              geometry_types: view.getGeometryTypes()
            });
          }
        }, this);
        // listen for errors
        view.bind('error', function(e, resp) {
          this.notice('error loading rows', 'error', 5000);
        }, this);

        view.bind('loading', function() {
          //this.notice(_t('loading query'), 'load', 0);
        }, this);

        view.bind('reset loaded', function() {
          if(view.modify_rows) {
            this.notice(view.affected_rows + ' rows affected');
            this.useSQLView(null);
          } else {
            this.notice(_t('loaded'));
          }
        }, this);

        // swicth source data
        this.dataModel = this.sqlView;
        view.table = this;
      } else {
        this._data.linkToSchema();
        this.dataModel = this._data;
        // get the original schema
        self.set({
          'schema': self.get('original_schema')
        });///*, { silent: true });
        this.fetch({
          success: function() {
            if(options.force_data_fetch) {
              self.data().fetch();
            }
          }
        });
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
      var xhr = this.elder('fetch', opts)
      $.when(xhr).done(function() {
        opts && opts.success && opts.success.old_success && opts.success.old_success();
        if(!silent) {
          self.notice('loaded');
        }
      }).fail(function(){
        if(!silent) {
          self.notice('error loading the table');
        }
      });
      return xhr;

    },

    /**
     * return true if the sql query alters table schema in some way
     */
    alterTable: function(sql) {
      return sql.search(/alter\s+\w+\s+/i) !== -1   ||
             sql.search(/drop\s+\w+/i)  !== -1;
    },

    /**
     * return true if the sql query alters table data
     */
    alterTableData: function(sql) {
      return this.alterTable(sql)       ||
             sql.search(/insert\s+into/i) !== -1  ||
             sql.search(/update\s+\w+\s+set/i) !== -1  ||
             sql.search(/delete\s+from/i) !== -1;
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
      var self = this;
      this.bind('columnRename', function(newName, oldName) {
        if(infowindow.containsField(oldName)) {
          infowindow.removeField(oldName);
          infowindow.addField(newName);
        }
      }, infowindow);
      this.bind('columnDelete', function(oldName, newName) {
        infowindow.removeField(oldName);
      }, infowindow);

      this.bind('change:schema', function() {
        var self = this;
        var columns = _(this.columnNames()).filter(function(c) {
          return !_.contains(infowindow.SYSTEM_COLUMNS, c);
        });

        function _hash(str){
            var hash = 0, c;
            for (i = 0; i < str.length; i++) {
                c = str.charCodeAt(i);
                hash = c + (hash << 6) + (hash << 16) - hash;
            }
            return hash;
        }

        if (this.isInSQLView()) {
          if (!infowindow.has('defaul_schema_fields')) {
            infowindow.saveFields('defaul_schema_fields');
          }
          var current_schema_key = 'schema_' + _hash(self.columnNames().sort().join(''));
          var previous_schema_key = 'schema_' + _hash(
            _(self.previous('schema')).pluck(0).sort().join('')
          );

          if(!infowindow.has(previous_schema_key)) {
            infowindow.saveFields(previous_schema_key);
          }
          if(infowindow.has(current_schema_key)) {
            infowindow.restoreFields(null, current_schema_key);
          } 
        } else {
          infowindow.restoreFields(null, 'defaul_schema_fields');
        }

        if (infowindow.get('template')) {
          // merge fields checking actual schema
          infowindow.mergeFields(columns);
        } else {
          // remove fields that no longer exist
          infowindow.removeMissingFields(columns);
        }
      }, this);

    },

    /**
     * when we do a PUT with latitude_column and longitude_column
     * the backend will create the_geom using those two columns
     */
    geocode_using: function(lat_column, lon_column) {
      var self = this;

      this.notice(this._TEXTS.tableGeoreferencing, 'load', 0);

      this.save({
        latitude_column: lat_column,
        longitude_column: lon_column
      }, {
        silent: true,
        success: function(r) {
          // when finish fetch the data again and throw a signal to notify the changes
          self.data().fetch();
          self.trigger('geolocated');

          self.notice(self._TEXTS.tableGeoreferenced);
        },
        error: function(msg, resp) {
          var err =  resp && JSON.parse(resp.responseText).errors[0];
          self.notice(msg + " " + err, 'error');
        },
        wait: true
      });
    },

    embedURL: function() {
      return "/tables/" + this.get('name') + "/embed_map"
    },

    hasTheGeom: function() {
      var currentSchema = this.get('schema');
      // if we have "the_geom" in our current schema, returnstrue
      for(var n in currentSchema) {
        if(currentSchema[n][0] === 'the_geom') {
          return true;
        }
      }
      return false;
    },

    /**
     * Checks the server to see if the table has any georeferenced row, independently of the applyed query
     * @return {promise}
     */
    fetchGeoreferenceStatus: function() {
      var dfd = $.Deferred();
      var username = (this.options && this.options.user_data)? this.options.user_data.username :
        (window.user_data? window.user_data.username : window.user_name);
      var api_key = (this.options && this.options.user_data)? this.options.user_data.api_key :
        (window.user_data? window.user_data.api_key : window.api_key);


      this.sqlApi = new this.sqlApiClass({
        user: username,
        version: 'v1',
        api_key: api_key,
        completeDomain: cdb.config.getSqlApiUrl()
      });

      var sql = 'SELECT the_geom FROM ' + this.get('name') + ' WHERE the_geom is not null';
      this.sqlApi.execute(sql).done(function(data){
        if(data.rows.length > 0) {
          dfd.resolve(true);
        } else {
          dfd.resolve(false);
        }
      });

      return dfd.promise();

    },


    /**
     * Checks the server to see if the current query has any georeferenced row
     * @return {promise}
     */
    fetchGeoreferenceQueryStatus: function() {
      var dfd = $.Deferred();
      var username = (this.options && this.options.user_data)? this.options.user_data.username :
        (window.user_data? window.user_data.username : window.user_name);
      var api_key = (this.options && this.options.user_data)? this.options.user_data.api_key :
        (window.user_data? window.user_data.api_key : window.api_key);
      if(!this.isGeoreferenced()) {
        var sql = '';
        if(this.sqlView) {
          sql = 'SELECT the_geom FROM ( ' + this.sqlView.getSQL() + ') as q WHERE q.the_geom is not null LIMIT 1';
        } else {
          sql = 'SELECT the_geom FROM ' + this.get('name') + ' WHERE the_geom is not null LIMIT 1';
        }
        this.sqlApi = new this.sqlApiClass({
          user: username,
          version: 'v1',
          api_key: api_key,
          completeDomain: cdb.config.getSqlApiUrl()
        });

        this.sqlApi.execute(sql).done(function(data){
          if(data.rows.length > 0) {
            dfd.resolve(true);
          } else {
            dfd.resolve(false);
          }
        }).error(function() {
          dfd.resolve(false);
        });
      } else {
        dfd.resolve(true);
      }
      return dfd.promise();
    },

    /**
     * Checks the current loaded records to see if they are georeferenced
     * @return {boolean}
     */
    isGeoreferenced: function() {

      var geoColumns = this.geomColumnTypes();
      if(geoColumns && geoColumns.length > 0) {
        // sometimes the columns are changed in the frontend site
        // and the geocolumns are not updated.
        // check the columns in local
        var georeferenced = this._data.any(function(row) {
          return row.hasGeometry();
        })
        return georeferenced;
      }
      return false;
    },

    /**
     * this function can only be called during change event
     * returns true if the geometry type has changed
     * for this method multipolygon and polygon are the same geometry type
     */
    geometryTypeChanged: function() {
      if (!('geometry_types' in this.changed)) return false;
      var geoTypes = this.get('geometry_types')
      var prevGeoTypes = this.previousAttributes().geometry_types;
      function normalize(e) {
        e = e.toLowerCase();
        if (e === 'st_multipolygon') {
          return 'st_polygon'
        }
        if (e === 'st_multilinestring') {
          return 'st_linestring'
        }
        if (e === 'st_multipoint') {
          return 'st_point'
        }
        return e;
      }

      if(!geoTypes ||
        geoTypes.length === 0 ||
        !prevGeoTypes || 
        prevGeoTypes.length === 0) {
        return true;
      }

      var n = normalize(geoTypes[0]);
      var o = normalize(prevGeoTypes[0]);
      return n !== o;
    }


  }, {
    /**
     * creates a new table from query
     * the called is responsable of calling save to create
     * the table in the server
     */
    createFromQuery: function(name, query) {
      return new cdb.admin.CartoDBTableMetadata({
        sql: query,
        name: name
      });
    }
  });

  cdb.admin.Row = cdb.core.Model.extend({

    _CREATED_EVENT: 'created',
    _CREATED_EVENT: 'creating',
    sqlApiClass: cartodb.SQL,

    urlRoot: function() {
      var table = this.table || this.collection.table;
      if(!table) {
        cdb.log.error("row has no table assined");
      }
      return '/api/v1/tables/' + table.get('name') + '/records/';
    },

    fetch: function(opts) {
      var self = this;
      var silent = opts && opts.silent;
      var username = (this.options && this.options.user_data)? this.options.user_data.username :
        (window.user_data? window.user_data.username : window.user_name);
      var api_key = (this.options && this.options.user_data)? this.options.user_data.api_key :
        (window.user_data? window.user_data.api_key : window.api_key);

      var table = this.table || this.collection.table;

      var sqlApi = new this.sqlApiClass({
        user: username,
        version: 'v1',
        api_key: api_key,
        completeDomain: cdb.config.getSqlApiUrl()
      });
      // this.trigger('loading')
      var sql = null;
      /*if(!table.containsColumn('cartodb_id')) {
        var firstShownRow = table.sqlView.pages[0] * table.sqlView.options.get('rows_per_page');
        var rowNumber  = this.options.rowNumber + firstShownRow;
        sql = 'WITH q AS (' + table.data().getSQL() + ') SELECT *, ST_AsGeoJSON(q.the_geom,8) as cdb_geojson from q OFFSET '+ rowNumber +' LIMIT 1';
      } else {
        sql = 'SELECT *, ST_AsGeoJSON(the_geom,8) as the_geom from ' + table.get('name') + ' WHERE cartodb_id = ' + this.get('cartodb_id');
      }*/
      sql = 'SELECT * '
      if(table.containsColumn('the_geom')) {
        sql += ',ST_AsGeoJSON(the_geom,8) as the_geom '
      }
      sql += ' from (' + table.data().getSQL() + ') _table_sql WHERE cartodb_id = ' + this.get('cartodb_id');
      // Added opts to sql execute function to apply
      // parameters ( like cache ) to the ajax request
      sqlApi.execute(sql, {}, opts).done(function(data){
        // self.trigger('loaded');
        if(self.parse(data.rows[0])) {
          if(data.rows[0].cdb_geojson != undefined) {
            data.rows[0].the_geom = data.rows[0].cdb_geojson;
          }
          self.set(data.rows[0]);//, {silent: silent});
          self.trigger('sync');
        }
      });

    },

    toJSON: function() {
      var attr = _.clone(this.attributes);
      // remove read-only attributes
      delete attr['updated_at'];
      delete attr['created_at'];
      delete attr['the_geom_webmercator'];
      if(!this.isGeometryGeoJSON()) {
        delete attr['the_geom'];
      }
      return attr;
    },

    isGeomLoaded: function() {
      var geojson = this.get('the_geom');
      return  (geojson !== 'GeoJSON' && geojson !== -1);
    },

    hasGeometry: function() {
      var the_geom = this.get('the_geom');
      return !!(the_geom != null && the_geom != undefined && the_geom != '')
      // in fact, if the_geom has anything but null or '', the row is georeferenced

      // if(typeof the_geom === 'string') {
      //   // if the geom contains GeoJSON, the row has a valid geometry, but is not loaded yet
      //   if(the_geom === 'GeoJSON')  {
      //     return true
      //   }

      //   try {
      //     var g = JSON.parse(the_geom);
      //     return !!g.coordinates;
      //   } catch(e) {
      //     return false;
      //   }
      // } else {
      //   if(the_geom) {
      //     return !!the_geom.coordinates;
      //   }
      //   return false;
      // }
    },
    /**
     * Checks if the_geom contains a valid geoJson
     */
    isGeometryGeoJSON: function() {
      var the_geom = this.get('the_geom');
      if(the_geom && typeof the_geom === 'object') {
        return !!the_geom.coordinates;
      } else if(typeof the_geom !== 'string') {
        return false;
      }
      // if the geom contains GeoJSON, the row has a valid geometry, but is not loaded yet
      if(the_geom === 'GeoJSON')  {
        return true
      }

      try {
        var g = JSON.parse(the_geom);
        return !!g.coordinates;
      } catch(e) {
        return false;
      }

      return false;

    },


    getGeomType: function() {
      var types = {
          'point': 'st_point',
          'multipoint': 'st_point',
          'linestring': 'st_linestring',
          'multilinestring': 'st_linestring',
          'polygon': 'st_polygon',
          'multipolygon': 'st_polygon',
          'GeometryCollection': 'st_geometry'
      }
      if (this.isGeomLoaded()) {
        // Problem geometry type from a WKB format
        // Not possible for the moment
        try {
          var geojson = JSON.parse(this.get('the_geom'));
          return types[geojson.type.toLowerCase()];
        } catch(e) {
          cdb.log.info("Not possible to parse geometry type");
        }
      }
      return null;
    }


  }, {
    RESERVED_COLUMNS: 'the_geom the_geom_webmercator cartodb_id created_at updated_at'.split(' '),
    isReservedColumn: function(c) {
      return _(cdb.admin.Row.RESERVED_COLUMNS).indexOf(c) !== -1;
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

    _PREVIEW_ITEMS_PER_PAGE: 10,
    _ITEMS_PER_PAGE: 20,

    initialize: function() {
      this.options = new cdb.core.Model({
        tag_name  : "",
        q         : "",
        page      : 1,
        type      : "table",
        per_page  : this._ITEMS_PER_PAGE
      });

      this.total_entries = 0;

      this.options.bind("change", this._changeOptions, this);
      this.bind("reset",          this._checkPage, this);
      this.bind("update",         this._checkPage, this);
      this.bind("add",            this._fetchAgain, this);
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
      this.total_entries--;
      this.elder('remove', options);
    },

    parse: function(response) {
      this.total_entries = response.total_entries;
      return response.tables;
    },

    _changeOptions: function() {
      this.trigger('updating');

      var self = this;
      $.when(this.fetch()).done(function(){
        self.trigger('forceReload')
      });
    },

    create: function(m) {
      var dfd = $.Deferred();
      Backbone.Collection.prototype.create.call(this,
        m,
        {
            wait: true,
            success: function() {
              dfd.resolve();

            },
            error: function() {
              dfd.reject();
            }
        }
      );
      return dfd.promise();
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
    },

    /**
     * Fetch the server for the collection, but not set it afterwards, only returns pases the
     * json throught a deferred object
     * @return {$.Deferred}
     */
    fetchButNotSet: function() {
      var dfd = $.Deferred();
      $.ajax({
        url: this.url(),
        dataType:'json',
        success:function(res){
          dfd.resolve(res);
        },
        error: function() {
          dfd.reject();
        }
      });

      return dfd.promise();
    },

    /**
     * If the number of lists is smaller than size parameter, fetch the list without setting it
     * and ad the last n elements to the collection.
     * This is needed to be able to add new elements to the collection without rewriting (AKA: lose the bindings)
     * the existant models (for example, if want to update the collection, but not re-render the view)
     * @param  {integer} size
     * @return {Promise}
     */
    refillTableList: function(size) {
      var self = this;
      var dfd = $.Deferred();
      var currentSize = this.models.length;
      var elementToAdd = size - currentSize;


      $.when(this.fetchButNotSet()).done(function(res) {
        // we need to update the current size
        var currentSize = self.models.length;
        var limit = res.tables.length >= size ? res.tables.length : size;
        for(var i = 0; i < limit; i++) {
          if(!self.hasTable(res.tables[i].name)) {
              self.add(res.tables[i], {silent:true});
            }
          // self.trigger('elementAdded', i);
        }
        dfd.resolve(true);
      })
      return dfd.promise();
    },

    hasTable: function(name) {
      for(var i in this.models)  {
        if(this.models[i].get('name') === name) {
          return true;
        }
      }
      return false;
    }
  });

})();
