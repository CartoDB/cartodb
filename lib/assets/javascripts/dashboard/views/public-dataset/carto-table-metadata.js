const _ = require('underscore');
const $ = require('jquery');
const Backbone = require('backbone');
const SQL = require('internal-carto.js').SQL;
const safeTableNameQuoting = require('dashboard/helpers/safe-table-name-quoting');
const cartoMetadataStatic = require('./carto-table-metadata-static');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const CartoTableData = require('dashboard/data/table/carto-table-data');
const ColumnModel = require('dashboard/data/table/column-model');
const RowModel = require('dashboard/data/table/row-model');
const PermissionModel = require('dashboard/data/permission-model');
const ImportModel = require('dashboard/data/import-model');
const TableSynchronizationModel = require('dashboard/data/table-synchronization-model');
const getSimpleGeometryType = require('builder/data/get-simple-geometry-type');
const retrigger = require('dashboard/helpers/retrigger');

const REQUIRED_OPTS = [
  'configModel'
];

const Base = Backbone.Model.extend({

  columnNames: function () {
    return _.map(this.get('schema'), function (c) {
      return c[0];
    });
  },

  columnName: function (idx) {
    return this.columnNames()[idx];
  }
});

const CartoTableMetadata = Base.extend({
  currentLoading: 0, // class variable (shared). I'm still not sure if this is messy as hell or powerfull as a transformer

  _TEXTS: {
    columnDeleted: 'Your column has been deleted',
    columnDeleting: 'Deleting your column',
    columnAdded: 'Your column has been added',
    columnAdding: 'Adding new column'
  },

  hiddenColumns: [
    'the_geom',
    'the_geom_webmercator',
    'cartodb_georef_status',
    'created_at',
    'updated_at',
    'cartodb_id'
  ],

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    _.bindAll(this, 'notice');
    this.readOnly = false;
    this.bind('change:schema', this._prepareSchema, this);
    this._prepareSchema();
    this.sqlView = null;
    this.synchronization = new TableSynchronizationModel({ configModel: opts.configModel });
    this.synchronization.linkToTable(this);
    this.synchronization.bind('change:id', function isSyncChanged () {
      this.trigger('change:isSync', this, this.synchronization.isSync());
    }, this);
    if (this.get('no_data_fetch')) {
      this.no_data_fetch = true;
      delete this.attributes.no_data_fetch;
    }
    this.data();
    this.bind('error', function (e, resp) {
      this.error('', resp);
    }, this);
    this._data.bind('error', function (e, resp) {
      this.notice('error loading rows, check your SQL query', 'error', 5000);
    }, this);

    this._data.bind('reset', function () {
      var view = this._data;
      this.set({
        schema: view.schemaFromData(this.get('schema')),
        geometry_types: view.getGeometryTypes()
      });
    }, this);

    retrigger.call(this, 'change', this._data, 'data:changed');
    retrigger.call(this, 'saved', this._data, 'data:saved');

    this.bind('change:table_visualization', function () {
      this.permission = new PermissionModel(this.get('table_visualization').permission, { configModel: this._configModel });
      this.trigger('change:permission', this, this.permission);
    }, this);

    // create permission if permission is set
    this.permission = new PermissionModel(this.get('permission'), { configModel: this._configModel });
  },

  url: function (method) {
    var version = this._configModel.urlVersion('table', method);
    var base = '/api/' + version + '/tables';
    if (this.isNew()) {
      return base;
    }
    return base + '/' + this.id;
  },

  // use the name as the id since the api works
  // in the same way to table name and id
  parse: function (resp, xhr) {
    if (resp.name) {
      resp.id = resp.name;
    }
    // move geometry_types to stats one
    // geometry_types from backend are not reliable anymore and it can only be used
    // for non editing stuff (showing icons, general checks on table list)
    resp.stats_geometry_types = resp.geometry_types;
    delete resp.geometry_types;
    delete resp.schema;
    return resp;
  },

  notice: function (msg, type, timeout) {
    this.trigger('notice', msg, type, timeout);
  },

  setReadOnly: function (_) {
    var trigger = false;
    if (this.readOnly !== _) {
      trigger = true;
    }
    this.readOnly = _;
    if (trigger) {
      this.trigger('change:readOnly', this, _);
    }
  },

  isReadOnly: function () {
    return this.readOnly || this.data().isReadOnly() || this.synchronization.isSync();
  },

  isSync: function () {
    return this.synchronization.isSync();
  },

  getUnqualifiedName: function () {
    var name = this.get('name');
    if (!name) return null;
    var tk = name.split('.');
    if (tk.length == 2) { // eslint-disable-line eqeqeq
      return tk[1];
    }
    return name;
  },

  // "user".table -> user.table
  getUnquotedName: function () {
    var name = this.get('name');
    return name && name.replace(/"/g, '');
  },

  sortSchema: function () {
    this.set('schema', CartoTableMetadata.sortSchema(this.get('schema')));
  },

  error: function (msg, resp) {
    let err = '';
    try {
      err = resp && resp.responseText && JSON.parse(resp.responseText).errors[0];
    } catch (e) {
    } finally {
      this.trigger('notice', msg + ': ' + err, 'error');
    }
  },

  _prepareSchema: function () {
    this._columnType = {};

    _(this.get('schema')).each((schema) => {
      this._columnType[schema[0]] = schema[1];
    });

    if (!this.isInSQLView()) {
      this.set('original_schema', this.get('schema'));
    }
  },

  columnNames: function (sc) {
    sc = sc || 'schema';
    return _(this.get(sc)).pluck(0);
  },

  containsColumn: function (name) {
    return _.contains(this.columnNames(), name);
  },

  columnNamesByType: function (type, sc) {
    sc = sc || 'schema';
    var t = _(this.get(sc)).filter(function (c) {
      return c[1] == type; // eslint-disable-line eqeqeq
    });
    return _(t).pluck(0);
  },

  // return geometry columns calculated backend stats
  // use geomColumnTypes if you need something reliable (but slower and async)
  statsGeomColumnTypes: function (geometryTypes) {
    return this.geomColumnTypes(this.get('stats_geometry_types'));
  },

  // return the current column types in an array
  // the values inside the array can be:
  //  'point', 'line', 'polygon'
  geomColumnTypes: function (geometryTypes) {
    var types = geometryTypes || this.get('geometry_types');
    var geomTypes = [];
    if (!_.isArray(types)) {
      return [];
    }
    var _map = {
      'st_multipolygon': 'polygon',
      'st_polygon': 'polygon',
      'st_multilinestring': 'line',
      'st_linestring': 'line',
      'st_multipoint': 'point',
      'st_point': 'point'
    };
    for (var t in types) {
      var type = types[t];
      // when there are rows with no geo type null is returned as geotype
      if (type) {
        var a = _map[type.toLowerCase()];
        if (a) {
          geomTypes.push(a);
        }
      }
    }
    return _.uniq(geomTypes);
  },

  /**
   *  Adding a new geometry type to the table
   *  @param geom type {st_polygon, st_point,...}
   *  @param set options
   */
  addGeomColumnType: function (t, opts) {
    if (!t) return;
    var types = _.clone(this.get('geometry_types')) || [];
    if (!_.contains(types, t)) {
      types.push(t);

      this.set({
        'geometry_types': types
      }, opts);
    }
  },

  nonReservedColumnNames: function () {
    return _.filter(this.columnNames(), (columnName) => {
      return !this.isReservedColumn(columnName);
    });
  },

  columnTypes: function () {
    return _.clone(this._columnType);
  },

  _getColumn: function (columnName) {
    if (this._columnType[columnName] === undefined) {
      return;
      // throw "the column does not exists";
    }
    var c = new ColumnModel({
      table: this,
      name: columnName,
      type: this._columnType[columnName],
      configModel: this._configModel
    }, { configModel: this._configModel });
    return c;
  },

  getColumnType: function (columnName, sc) {
    sc = sc || 'schema';
    var t = _(this.get(sc)).filter(function (c) {
      return c[0] == columnName;// eslint-disable-line eqeqeq
    });
    if (t.length > 0) {
      return t[0][1];
    }
  },

  addColumn: function (columnName, columnType, opts) {
    var c = new ColumnModel({
      table: this,
      _name: columnName,
      type: columnType || 'string',
      configModel: this._configModel
    }, { configModel: this._configModel });
    this.notice(this._TEXTS.columnAdding, 'load', 0);
    c.save(null, {
      success: (model, obj) => {
        this.notice(this._TEXTS.columnAdded, 'info');
        this.trigger('columnAdd', columnName);
        this.data().fetch();
        opts && opts.success && opts.success(model, obj);
      },
      error: (error, resp) => {
        this.error('error adding column', resp);
        opts && opts.error && opts.error(error);
      },
      wait: true
    });
  },

  deleteColumn: function (columnName, opts) {
    var c = this._getColumn(columnName);
    if (c !== undefined) {
      this.notice(this._TEXTS.columnDeleting, 'load', 0);
      c.destroy({
        success: () => {
          this.trigger('columnDelete', columnName);
          this.notice(this._TEXTS.columnDeleted, 'info');
          this.data().fetch();
          opts && opts.success && opts.success();
        },
        error: (e, resp) => {
          this.error('error deleting column', resp);
          opts && opts.error && opts.error();
        },
        wait: true
      });
    }
  },

  renameColumn: function (columnName, newName, opts) {
    if (columnName == newName) return; // eslint-disable-line eqeqeq
    var c = this._getColumn(columnName);
    var oldName = c.get('name');
    c.set({
      new_name: newName,
      old_name: c.get('name')
    });
    this.notice('renaming column', 'load', 0);
    c.save(null, {
      success: (mdl, data) => {
        this.notice('Column has been renamed', 'info');
        this.trigger('columnRename', newName, oldName);
        this.data().fetch();
        opts && opts.success && opts.success(mdl, data);
      },
      error: (e, resp) => {
        console.error("can't rename column");
        this.error('error renaming column', resp);
        opts && opts.error && opts.error(e, resp);
      },
      wait: true
    });
  },

  isTypeChangeAllowed: function (columnName, newType) {
    var deactivateMatrix = {
      'number': ['date'],
      'boolean': ['date'],
      'date': ['boolean']
    };
    var c = this._getColumn(columnName);
    if (!c) {
      return true;
    }
    var type = c.get('type');
    var deactivated = deactivateMatrix[type] || [];
    deactivated = deactivated.concat([type]);
    return !_.contains(deactivated, newType);
  },

  isTypeChangeDestructive: function (columnName, newType) {
    var columnType = this.getColumnType(columnName);

    var destructiveMatrix = {
      'string': {
        'string': false,
        'number': true,
        'date': true,
        'boolean': true
      },
      'number': {
        'string': false,
        'number': false,
        'date': true,
        'boolean': true
      },
      'date': {
        'string': false,
        'number': true,
        'date': false,
        'boolean': true
      },
      'boolean': {
        'string': false,
        'number': false,
        'date': true,
        'boolean': false
      }
    };
    return destructiveMatrix[columnType][newType];
  },

  changeColumnType: function (columnName, newType, opts) {
    var c = this._getColumn(columnName);

    if (this.getColumnType(columnName) == newType) { // eslint-disable-line eqeqeq
      opts && opts.success && opts.success();
      return;
    }
    this.saveNewColumnType(c, newType, opts);
  },

  saveNewColumnType: function (column, newType, opts) {
    column.set({ type: newType });
    this.notice('Changing column type', 'load', 0);
    column.save(null, {
      success: () => {
        this.notice('Column type has been changed', 'info');
        this.trigger('typeChanged', newType); // to make it testable
        this.data().fetch();
        opts && opts.success && opts.success();
      },
      error: (e, resp) => {
        this.trigger('typeChangeFailed', newType, e); // to make it testable
        this.error('error changing column type', resp);
        opts && opts.error && opts.error(e, resp);
      },
      wait: true
    });
  },

  /**
   * returns the original data for the table not the current applied view
   */
  originalData: function () {
    return this._data;
  },

  data: function () {
    if (this._data === undefined) {
      this._data = new CartoTableData(null, {
        table: this,
        configModel: this._configModel
      });
      this.bindData();
    }
    if (this.sqlView) {
      return this.sqlView;
    }
    return this._data;
  },

  bindData: function (data) {
    if (this._data && !this._data.bindedReset) {
      retrigger.call(this, 'sync', this._data, 'dataLoaded');
      retrigger.call(this, 'add', this._data, 'dataAdded');
      this._data.bindedReset = true;
    }
    if (this.sqlView && !this.sqlView.bindedReset) {
      retrigger.call(this, 'sync', this.sqlView, 'dataLoaded');
      retrigger.call(this, 'add', this.sqlView, 'dataAdded');
      this.sqlView.bindedReset = true;
    }
  },

  useSQLView: function (view, options) {
    if (!view && !this.sqlView) return;
    options = options || {};

    if (this.sqlView) {
      this.sqlView.unbind(null, null, this);
      this.sqlView.unbind(null, null, this._data);
    }

    // reset previous
    if (!view && this.sqlView) {
      this.sqlView.table = null;
    }

    this.sqlView = view;
    this.bindData();

    if (view) {
      view.bind('sync reset', function () {
        if (!view.modify_rows) {
          this.set({
            schema: view.schemaFromData(this.get('schema')),
            geometry_types: view.getGeometryTypes()
          });
        }
      }, this);
      // listen for errors
      view.bind('error', function (e, resp) {
        this.notice('error loading rows, check your SQL query', 'error', 5000);
      }, this);

      view.bind('loading', function () {
        // this.notice(_t('loading query'), 'load', 0);
      }, this);

      view.bind('reset loaded', function () {
        if (view.modify_rows) {
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
      this.dataModel = this._data;
      // get the original schema
      this.set({
        'schema': this.get('original_schema')
      });/// *, { silent: true });
      this.data().fetch();
    }
    this.trigger('change:dataSource', this.dataModel, this);
  },

  isInSQLView: function () {
    return !!this.sqlView;
  },

  /**
   * replace fetch functionally to add some extra call for logging
   * it can be used in the same way fetch is
   */
  fetch: function (opts) {
    const silent = opts ? opts.silent : false;
    if (!silent) {
      this.notice('loading table', 'load', this, 0, 0);
    }
    var xhr = Base.prototype.fetch.call(this, opts);
    $.when(xhr).done(() => {
      opts && opts.success && opts.success.old_success && opts.success.old_success();
      if (!silent) {
        this.notice('loaded');
      }
    }).fail(() => {
      if (!silent) {
        this.notice('error loading the table');
      }
    });
    return xhr;
  },

  isReservedColumn: function (c) {
    return RowModel.isReservedColumn(c);
  },

  /**
   * when a table is linked to a infowindow each time a column
   * is renamed or removed the table pings to infowindow to remove
   * or rename the fields
   */
  linkToInfowindow: function (infowindow) {
    this.bind('columnRename', function (newName, oldName) {
      if (infowindow.containsField(oldName)) {
        infowindow.removeField(oldName);
        infowindow.addField(newName);
      }
    }, infowindow);
    this.bind('columnDelete', function (oldName, newName) {
      infowindow.removeField(oldName);
    }, infowindow);

    this.bind('change:schema', function () {
      var columns = _(this.columnNames()).filter(function (c) {
        return !_.contains(infowindow.SYSTEM_COLUMNS, c);
      });

      function _hash (str) {
        var hash = 0;
        var c;
        var i;
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
        var current_schema_key = 'schema_' + _hash(this.columnNames().sort().join(''));
        var previous_schema_key = 'schema_' + _hash(
          _(this.previous('schema')).pluck(0).sort().join('')
        );

        if (!infowindow.has(previous_schema_key)) {
          infowindow.saveFields(previous_schema_key);
        }
        if (infowindow.has(current_schema_key)) {
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

  embedURL: function () {
    return '/tables/' + this.get('name') + '/embed_map';
  },

  /**
   * @deprecated use vis.viewUrl() or vis.viewUrl(currentUser) instead.
   */
  viewUrl: function () {
    return this._configModel.prefixUrl() + '/tables/' + this.getUnqualifiedName();
  },

  hasTheGeom: function () {
    var currentSchema = this.get('schema');
    // if we have "the_geom" in our current schema, returnstrue
    for (var n in currentSchema) {
      if (currentSchema[n][0] === 'the_geom') {
        return true;
      }
    }
    return false;
  },

  /**
   * Checks the server to see if the table has any georeferenced row, independently of the applyed query
   * @return {promise}
   */
  fetchGeoreferenceStatus: function () {
    var dfd = $.Deferred();
    var username = (this.options && this.options.user_data) ? this.options.user_data.username
      : (window.user_data ? window.user_data.username : window.user_name);
    var api_key = (this.options && this.options.user_data) ? this.options.user_data.api_key
      : (window.user_data ? window.user_data.api_key : window.api_key);

    this.sqlApi = new SQL({
      user: username,
      version: 'v1',
      api_key: api_key,
      sql_api_template: this._configModel.getSqlApiBaseUrl()
    });

    var sql = 'SELECT the_geom FROM ' + this.get('name') + ' WHERE the_geom is not null';
    this.sqlApi.execute(sql).done(function (data) {
      if (data.rows.length > 0) {
        dfd.resolve(true);
      } else {
        dfd.resolve(false);
      }
    });

    return dfd.promise();
  },

  /**
   * Checks the current loaded records to see if they are georeferenced
   * @return {boolean}
   */
  isGeoreferenced: function () {
    var geoColumns = this.geomColumnTypes();
    if (geoColumns && geoColumns.length > 0) {
      return true;
    } else {
      if (!this.isInSQLView()) {
        // sometimes the columns are changed in the frontend site
        // and the geocolumns are not updated.
        // check the columns in local
        return this._data.any(function (row) {
          return row.hasGeometry();
        });
      }
    }
    return false;
  },

  /**
   * this function can only be called during change event
   * returns true if the geometry type has changed
   * for this method multipolygon and polygon are the same geometry type
   */
  geometryTypeChanged: function () {
    if (!('geometry_types' in this.changed)) return false;
    var geoTypes = this.get('geometry_types');
    var prevGeoTypes = this.previousAttributes().geometry_types;
    function normalize (e) {
      e = e.toLowerCase();
      if (e === 'st_multipolygon') {
        return 'st_polygon';
      }
      if (e === 'st_multilinestring') {
        return 'st_linestring';
      }
      if (e === 'st_multipoint') {
        return 'st_point';
      }
      return e;
    }

    if (!geoTypes ||
      geoTypes.length === 0 ||
      !prevGeoTypes ||
      prevGeoTypes.length === 0) {
      return true;
    }

    var n = normalize(geoTypes[0]);
    var o = normalize(prevGeoTypes[0]);
    return n !== o;
  },

  /**
   * Get necessary data create a duplicated dataset from this table.
   *
   * @param {Object} newName name of new dataset.
   * @param {Object} callbacks
   * @returns {Object}
   */
  duplicate: function (newName, callbacks) {
    callbacks = callbacks || {};

    // Extracted from duplicate_table_dialog
    var data = {
      table_name: newName
    };

    // Set correct data object, depending on if the app has a query applied or not
    if (this.isInSQLView()) {
      var query = this.data().getSQL();
      data.sql = (!query || query == '') ? 'SELECT * FROM ' + safeTableNameQuoting(this.get('name')) : query; // eslint-disable-line eqeqeq
    } else {
      data.table_copy = this.get('name');
    }

    var importModel = new ImportModel();
    importModel.save(data, {
      error: callbacks.error,
      success: (model, changes) => {
        var checkImportModel = new ImportModel({
          item_queue_id: changes.item_queue_id
        });

        checkImportModel.bind('importComplete', () => {
          checkImportModel.unbind();

          // So import is done, create new table object from the new table and fetch, callback once finished.
          var newTable = new CartoTableMetadata({
            id: checkImportModel.get('table_id')
          }, { configModel: this._configModel });

          newTable.fetch({
            success: function () {
              callbacks.success(newTable);
            },
            error: callbacks.error
          });
        });

        checkImportModel.bind('importError', function () {
          checkImportModel.unbind();
          callbacks.error.apply(this, arguments);
        });

        checkImportModel.pollCheck();
      }
    });
  },

  /**
   * Get the visualizations that are using this table dataset.
   * Note! a .fetch() is required to be sure the data to be available.
   * @return {Array}
   */
  dependentVisualizations: function () {
    // dependent = visualizations with a single layer
    // non-dependant = have more than this dataset as a layer
    return _.chain(this.get('dependent_visualizations'))
      .union(this.get('non_dependent_visualizations'))
      .compact()
      .value() || [];
  },

  getGeometryType: function () {
    var types = this.get('geometry_types');
    var geomTypes = [];
    if (!_.isArray(types)) {
      return [];
    }

    for (var t in types) {
      var type = types[t];
      // when there are rows with no geo type null is returned as geotype
      if (type) {
        var a = getSimpleGeometryType(type.toLowerCase());
        if (a) {
          geomTypes.push(a);
        }
      }
    }

    return _.uniq(geomTypes);
  }

}, {
  /**
   * creates a new table from query
   * the called is responsable of calling save to create
   * the table in the server
   */
  createFromQuery: function (name, query, configModel) {
    return new CartoTableMetadata({
      sql: query,
      name: name
    }, { configModel });
  },

  ...cartoMetadataStatic
});

module.exports = CartoTableMetadata;
