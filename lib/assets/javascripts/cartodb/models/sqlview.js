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

    this.bind('error', function() {
      this.reset([]);
    });
    //this.initOptions();
    if(options && options.sql) {
      this.setSQL(options.sql);
    }
  },

  /**
  * we need to override sync to avoid the sql request to be sent by GET.
  * For security reasons, we need them to be send as a PUT request.
  * @method sync
  * @param method {'save' || 'read' || 'delete' || 'create'}
  * @param model {Object}
  * @param options {Object}
  */
  sync: function(method, model, options) {
    if(!options) { options = {}; };
    options.type = 'PUT';
    options.data = this._createUrlOptions();
    return Backbone.sync.call(this, method, this, options)
  },

  _parseSQL: function(sql) {
    sql = sql.replace(/([^\\]){x}/g, '$10').replace(/\\{x}/g, '{x}')
    sql = sql.replace(/([^\\]){y}/g, '$10').replace(/\\{y}/g, '{y}')
    sql = sql.replace(/([^\\]){z}/g, '$10').replace(/\\{z}/g, '{z}')

    // Substitute mapnik tokens
    // resolution at zoom level 0
    var res = '156543.03515625';
    // full webmercator extent
    var ext = 'ST_MakeEnvelope(-20037508.5,-20037508.5,20037508.5,20037508.5,3857)';
    sql = sql.replace('!bbox!', ext)
             .replace('!pixel_width!', res)
             .replace('!pixel_height!', res);

    return sql
  },

  setSQL: function(sql, opts) {
    this.readOnly = true;
    // reset options whiout changing raising a new fetchs
    this.options.set({
      page: 0,
      mode: 'asc',
      order_by: '',
      filter_column: '',
      filter_value: ''
    }, { silent: true } );

    opts = opts || {}
    var silent = opts.silent;
    opts.silent = true;
    this.options.set({ sql : sql ? this._parseSQL(sql): '' }, opts);
    if(!silent) {
      this.options.trigger('change:sql', this.options, sql);
    }
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

  fetch: function(opts) {
    this.trigger('loading', opts);
    //this.reset([], { silent: true });
    this.elder('fetch', opts);
  },

  url: function() {
    var u = '/api/v1/queries/';
    //u += "?" + this._createUrlOptions();
    return u;
  },

  isReadOnly: function() {
    return this.readOnly;
  },

  filterColumnSQL: function(columnName, tableName, filter, columnType) {
    columnType = columnType || 'string'
    var sql = "SELECT * from <%= table %> where <%= column %> ilike '%<%=filter%>%'";
    if(columnType === 'number') {
      sql = "SELECT * from <%= table %> where <%= column %> = <%= filter %>"
    } else if (columnType === 'boolean') {
      if(filter != 'true') {
        filter = 'false'
      }
      sql = "SELECT * from <%= table %> where <%= column %> = <%= filter %>"
    }

    return _.template(sql, {
      column: columnName,
      table: tableName,
      filter: filter
    });
  },

  filterColumn: function(columnName, tableName, filter) {
    // filter table by column
    this.setSQL(this.filterColumnSQL(columnName, tableName, filter));
    this.readOnly = false;
  },

  quartiles: function(nslots, column, callback, error) {
    var tmpl = _.template('SELECT quartile, max(<%= column %>) as maxAmount FROM (SELECT <%= column %>, ntile(<%= slots %>) over (order by <%= column %>) as quartile FROM (<%= sql %>) as _rambo WHERE <%= column %> IS NOT NULL) x GROUP BY quartile ORDER BY quartile');
    this._sqlQuery(tmpl({
      slots: nslots,
      sql: this.options.get('sql'),
      column: column
    }),
    function(data) {
      callback(_(data.rows).pluck('maxamount'));
    },
    error);
  },

  // returns if the query contains geo data
  isGeoreferenced: function() {
    if(this.size()) {
      return this.models.some(function(row, i, a) {
        return row.hasGeometry();
      })

    }
    return false;
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
