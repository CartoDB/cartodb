var Uint8Array = torque.types.Uint8Array;
var Int32Array = torque.types.Int32Array;
var Uint32Array = torque.types.Uint32Array;

// format('hello, {0}', 'rambo') -> "hello, rambo"
function format(str) {
  for(var i = 1; i < arguments.length; ++i) {
    var attrs = arguments[i];
    for(var attr in attrs) {
      str = str.replace(RegExp('\\{' + attr + '\\}', 'g'), attrs[attr]);
    }
  }
  return str;
}

var filterableJson = function (options) {
  this._ready = false;
  this._tileQueue = [];
  this.options = options;
  this._filters = {};
  this._tileProcessingQueue=[]
  this._workers = [];
  this._maxWorkerNo = this.options.maxWorkerNo || 4;

  this.setupWorkerPool()

  this.options.tiler_protocol = options.tiler_protocol || 'http';
  this.options.tiler_domain = options.tiler_domain || 'cartodb.com';
  this.options.tiler_port = options.tiler_port || 80;

  // check options
  if (options.resolution === undefined ) throw new Error("resolution should be provided");
  if(options.start === undefined) {
    this._fetchKeySpan();
  } else {
    this._setReady(true);
  }
};



filterableJson.prototype = {

  setupWorkerPool:function(){
    for(var i=0; i< this._maxWorkerNo; i++){
      this._workers.push(this.createProccessTileWorker())
    }
  },

  getAvalaibleWorker:function(){
    return this._workers.pop()
  },

  releaseWorker:function(worker){
    this._workers.push(worker)
    this.processNextTileRequestInQueue()
  },

  processNextTileRequestInQueue:function(){
    if(this._tileProcessingQueue.length>0){
      job = this._tileProcessingQueue.pop()
      this.requestWorker(job.rows,job.coord,job.zoom, job.options, job.callback)
    }
  },

  requestWorker:function(rows,coord,zoom,options,callback){
    worker = this.getAvalaibleWorker()
    self = this
    if(worker){
      worker.onmessage = function(e){
        callback(e.data)
        self.releaseWorker(this)
      }
      worker.postMessage(JSON.stringify({rows: rows, coord: {x:coord.x,y:coord.y}, zoom:zoom, options: options}))
    }
    else{
      this.addToTileProcessingQueue(rows,coord,zoom,options,callback)
    }
  },

  addToTileProcessingQueue:function(rows,coord,zoom, options, callback){
    this._tileProcessingQueue.push({rows:rows, coord:coord, zoom:zoom, options: options, callback:callback})
  },

  /**
   * Creates a worker to process the tile
   */
  createProccessTileWorker: function(){
    var workerFunction = "var proccessTile ="+ this.proccessTileSerial.toString()
    var wrapper = "; self.onmessage = function(e){var data = JSON.parse(e.data); JSON.stringify(self.postMessage(proccessTile(data.rows,data.coord, data.zoom, data.options)))}"
    var script = workerFunction + wrapper;
    var blob = new Blob([script], {type: "text/javascript"})
    var worker  = new Worker(window.URL.createObjectURL(blob))
    return worker
  },

  proccessTile: function(rows, coord, zoom, callback){
    var self = this;
    if(typeof(Worker) === "undefined"){
      callback(this.proccessTileSerial(rows,coord,zoom, this.options))
    }
    else {
      var workerSafeOptions = {
        resolution: this.options.resolution,
        fields: this.options.fields
      }
      this.requestWorker(rows, coord, zoom, workerSafeOptions, callback)
    }
  },

  /**
   * return the torque tile encoded in an efficient javascript
   * structure:
   * {
   *   x:Uint8Array x coordinates in tile reference system, normally from 0-255
   *   y:Uint8Array y coordinates in tile reference system
   *   Index: Array index to the properties
   * }
   */
  proccessTileSerial: function(rows, coord, zoom, options) {
    // utility function for hashing categories
    var r;
    var x = new Uint8Array(rows.length);
    var y = new Uint8Array(rows.length);

    if(typeof(Profiler) != 'undefined') {
      var prof_mem = Profiler.metric('ProviderJSON:mem');
      var prof_point_count = Profiler.metric('ProviderJSON:point_count');
      var prof_process_time = Profiler.metric('ProviderJSON:process_time').start()
    }

    var categoryMapping = {}
    var categoryMappingSize = {}
    var fields = options.fields;

    for (var i = 0 ; i < fields.length; ++i) {
      if (fields[i].type === 'cat') {
        categoryMapping[i] = {};
        categoryMappingSize[i] = 0;
      }
    }

    // count number of steps
    var maxDateSlots = Object.keys(rows[0].d).length;
    var steps = maxDateSlots;


    // reserve memory for all the steps
    var timeIndex = new Int32Array(maxDateSlots + 1); //index-size
    var timeCount = new Int32Array(maxDateSlots + 1);
    var renderData = new Float32Array(rows.length * steps); //(this.options.valueDataType || type)(steps);
    var renderDataPos = new Uint32Array(rows.length * steps);

    if(typeof(Profiler) !='undefined'){
      prof_mem.inc(
        4 * maxDateSlots + // timeIndex
        4 * maxDateSlots + // timeCount
        steps + //renderData
        steps * 4
      ); //renderDataPos

      prof_point_count.inc(rows.length);
    }

    var rowsPerSlot = {};
    // var steps = _.range(maxDateSlots);
    var steps = []

    for(var i=0 ; i< maxDateSlots; i++){
      steps.push(i)
    }

    // precache pixel positions
    for (var r = 0; r < rows.length; ++r) {
      var row = rows[r];
      x[r] = row.x * options.resolution;
      // fix value when it's in the tile EDGE
      // TODO: this should be fixed in SQL query
      if (row.y === -1) {
        y[r] = 0;
      } else {
        y[r] = row.y * options.resolution;
      }

      var vals = row.d;

      for (var j = 0, len = steps.length; j < len; ++j) {
          var rr = rowsPerSlot[steps[j]] || (rowsPerSlot[steps[j]] = []);
          var k = 'f' + (j + 1)
          var v = vals[k];
          if (options.fields[j].type === 'cat') {
            var mapping = categoryMapping[j];
            var m = mapping[v]
            if (!m) {
                var count = ++categoryMappingSize[j];
                v = mapping[String(v)] = count;
            } else {
              v = m;
            }
          }
          rr.push([r, v]);
      }

    }

    // for each timeslot search active buckets
    var renderDataIndex = 0;
    var timeSlotIndex = 0;
    var i = 0;
    for(var i = 0; i <= maxDateSlots; ++i) {
      var c = 0;
      var slotRows = rowsPerSlot[i]
      if(slotRows) {
        for (var r = 0; r < slotRows.length; ++r) {
          var rr = slotRows[r];
          ++c;
          renderDataPos[renderDataIndex] = rr[0]
          renderData[renderDataIndex] = rr[1];
          ++renderDataIndex;
        }
      }
      timeIndex[i] = timeSlotIndex;
      timeCount[i] = c;
      timeSlotIndex += c;
    }

    if(typeof(Profiler) !='undefined'){
      prof_process_time.end();
    }

    // invert the mapping
    var invertedMapping = {}
    for (var i = 0 ; i < fields.length; ++i) {
      if (fields[i].type === 'cat') {
        var cat = categoryMapping[i];
        invertedMapping[i] = {}
        for (var k in cat) {
          invertedMapping[i][cat[k]] = k;
        }
      }
    }

    return {
      x: x,
      y: y,
      z: zoom,
      coord: {
        x: coord.x,
        y: coord.y,
        z: zoom
      },
      timeCount: timeCount,
      timeIndex: timeIndex,
      renderDataPos: renderDataPos,
      renderData: renderData,
      maxDate: maxDateSlots,
      categories: invertedMapping
    };
  },

  // returns a tile resampled to `zoom`
  resample: function (tile, zoom) {
  },

  _generateFilterSQLForCat: function(name, categories, exclusive, escape_quotes) {
    return name + (exclusive ? " not in ": " in") + '(' + categories.map(function(c) {
      if (escape_quotes) {
      // escape ', double escape. one for javascript, another one for postgres
        c = c.replace("'", "''''");
        return "''" + c + "''";
      } else {
        c = c.replace("'", "''");
        return "'" + c + "'";
      }
    }).join(',') + ')';
  },

  _generateFilterSQLForRange: function(name,range) {
    var result = ""
    if (range.start) {
      result += " " + name + " > " + range.start;
    }
    if (range.end) {
      if (range.start) {
        result += " and "
      }
      result += " " + name + " <= " + range.end;
    }
    return result
  },

  _setFilters:function(filters){
    this.filters = filters
  },

  _generateFiltersSQL: function(escape_quotes, filter_columns) {
    filter_columns = filter_columns || [];
    escape_quotes = escape_quotes === undefined ? true: false;
    var self = this;
    return Object.keys(this._filters).map(function(filterName) {
      if (_.contains(filter_columns, filterName)) {
        return ""
      }
      var filter = self._filters[filterName]
      if (filter) {
        if (filter.type == 'range') {
          return  self._generateFilterSQLForRange(filterName, filter.range)
        }
        else if (filter.type == 'cat' && filter.categories.length) {
          return self._generateFilterSQLForCat(filterName, filter.categories, filter.exclusive, escape_quotes)
        }
        else {
          return ""
        }
      }
      else{
        return ""
      }
    }).filter(function(f) {
      return f.length > 0;
    }).map(function(f) {
      return "(" + f + ")";
    }).join(' and ')
  },

  url: function(subhost) {
    var opts = this.options;
    return opts.sql_api_template.replace('{user}', (opts.user_name || opts.user)).replace('{s}', subhost) + "/api/v1/sql";
  },

  _hash: function(str) {
    var hash = 0;
    if (!str || str.length == 0) return hash;
    for (var i = 0, l = str.length; i < l; ++i) {
        hash = (( (hash << 5 ) - hash ) + str.charCodeAt(i)) | 0;
    }
    return hash;
  },

  _extraParams: function() {
    if (this.options.extra_params) {
      var p = [];
      for(var k in this.options.extra_params) {
        var v = this.options.extra_params[k];
        if (v) {
          p.push(k + "=" + encodeURIComponent(v));
        }
      }
      return p.join('&');
    }
    return null;
  },

  isHttps: function() {
    return this.options.sql_api_protocol && this.options.sql_api_protocol === 'https';
  },

  // execute actual query
  sql: function(sql, callback, options) {
    options = options || {};
    var subdomains = this.options.subdomains || 'abcd';
    url = this.url(subdomains[Math.abs(this._hash(sql))%subdomains.length]);
    var extra = this._extraParams();
    torque.net.get( url + "?q=" + encodeURIComponent(sql) + (extra ? "&" + extra: ''), function (data) {
        if(options.parseJSON) {
          data = JSON.parse(data && data.responseText);
        }
        callback && callback(data);
    });
  },

  getTileData: function(coord, zoom, callback) {
    if(!this._ready) {
      this._tileQueue.push([coord, zoom, callback]);
    } else {
      this._getTileData(coord, zoom, callback);
    }
  },

  _setReady: function(ready) {
    this._ready = true;
    this._processQueue();
    this.options.ready && this.options.ready();
  },

  _processQueue: function() {
    var item;
    while (item = this._tileQueue.pop()) {
      this._getTileData.apply(this, item);
    }
  },

  _getTableSQL: function(coord, zoom) {
    return format("(WITH opt as ( SELECT table_name as tt FROM selectivity(x:={x}, y:={y}, z:={z}, tables:=ARRAY[{overview_tables}], where_clause:='{filters}') where nrows > 5000 and cost < 400000 order by nrows asc limit 1) select (CASE WHEN EXISTS(select 1 from opt) THEN (select tt from opt) else '{table}' END))", {
      overview_tables: this.options.overview_tables.map(function(t) { return "'" + t + "'"; }).join(','),
      table: this.options.table,
      z: zoom,
      x: coord.x,
      y: coord.y,
      filters: this._generateFiltersSQL()
    });
  },

  /**
   * `tile`                             the tile the point resides on
   * `x`                                the x pixel coord on the tile
   * 'y'                                the y pixel coord on the tile
   * 'maxNo'                            the maximum number of points to return
   * 'pixel tollerance around click'    How many pixels to search around the click point
   * @applyFilters: apply current filters to fetch the data
   * 'callback'                         function(rows) returns an array of the data for that point
   */
  getDataForTorquePixel: function(tile, x, y, maxNo, tolerance, applyFilters, callback){
    shift = 23 - tile.z
    tolerance = tolerance || 20
    //TODO: use quadkey to filter
    var sql = [
      "select * from {table}",
      "where (quadkey between (xyz2range({x},{y},{z})).min and (xyz2range({x},{y},{z})).max) ",
      "and (((quadkey_x & (255 << {shift})) >> {shift}) - {torque_tile_x}) between -{tolerance} and {tolerance}",
      "and (((quadkey_y & (255 << {shift})) >> {shift}) - {torque_tile_y}) between -{tolerance} and {tolerance} "
    ]

    if (applyFilters) {
      var f = this._generateFiltersSQL(false);
      if (f.length) {
        sql.push("and (" + f + ")");
      }
    }

    sql.push("limit {maxNo}");

    sql = sql.join(' ')

    var query = format(sql,{
      x: tile.x,
      y: tile.y,
      z: tile.z,
      table: this.options.table,
      torque_tile_x: x,
      torque_tile_y: y,
      maxNo: maxNo,
      shift: shift,
      tolerance: tolerance
    })

    this.sql(query,function(data){
      if (data) {
        var rows = JSON.parse(data.responseText).rows;
        callback(rows)
      }
      else {
        callback(null)
      }
    })
  },

  /**
   * `coord` object like {x : tilex, y: tiley }
   * `zoom` quadtree zoom level
   */
  _getTileData: function(coord, zoom, callback) {
    if(typeof(Profiler) != 'undefined') {
      var prof_fetch_time = Profiler.metric('ProviderJSON:tile_fetch_time').start()
    }
    this.table = this.options.table;
    var numTiles = 1 << zoom;

    var column_conv = this.options.column;

    var sql = "select * from torque_tile_json({x}, {y}, {zoom}, ARRAY[{fields}], {table}, '{filters}')";

    var query = format(sql, {
      zoom: zoom,
      x: coord.x,
      y: coord.y,
      fields: _.map(this.options.fields, function(f) {
        if (f.type === 'cat') {
          return "'mode() within group (order by " + f.name + ")'";
        }
        var agg = f.agg || 'avg';
        return "'" + agg + "(" + (f.column || f.name) + ")'";
      }).join(','),
      column: column_conv,
      table: this._getTableSQL(coord, zoom),
      filters: this._generateFiltersSQL()
    });


    var self = this;
    this.sql(query, function (data) {
      if (data) {
        var rows = JSON.parse(data.responseText).rows;
        if (rows.length !== 0) {
          self.proccessTile(rows, coord, zoom,callback);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
      if(typeof(Profiler) != 'undefined') {
        prof_fetch_time.end();
      }
    });
  },

  getKeySpan: function() {
    return {
      start: this.options.start * 1000,
      end: this.options.end * 1000,
      step: this.options.step,
      steps: this.options.steps,
      columnType: this.options.is_time ? 'date': 'number'
    };
  },

  setColumn: function(column, isTime) {
    this.options.column = column;
    this.options.is_time = isTime === undefined ? true: false;
    this.reload();
  },

  setResolution: function(res) {
    this.options.resolution = res;
  },

  // return true if tiles has been changed
  setOptions: function(opt) {
    var refresh = false;

    if(opt.resolution !== undefined && opt.resolution !== this.options.resolution) {
      this.options.resolution = opt.resolution;
      refresh = true;
    }

    if(opt.steps !== undefined && opt.steps !== this.options.steps) {
      this.setSteps(opt.steps, { silent: true });
      refresh = true;
    }

    if(opt.column !== undefined && opt.column !== this.options.column) {
      this.options.column = opt.column;
      refresh = true;
    }

    if(opt.countby !== undefined && opt.countby !== this.options.countby) {
      this.options.countby = opt.countby;
      refresh = true;
    }

    if(opt.data_aggregation !== undefined) {
      var c = opt.data_aggregation === 'cumulative';
      if (this.options.cumulative !== c) {
        this.options.cumulative = c;
        refresh = true;
      }
    }

    if (refresh) this.reload();
    return refresh;

  },

  reload: function() {
    this._ready = false;
    this._fetchKeySpan();
  },

  setSQL: function(sql) {
    if (this.options.sql != sql) {
      this.options.sql = sql;
      this.reload();
    }
  },

  getSteps: function() {
    return Math.min(this.options.steps, this.options.data_steps);
  },

  setSteps: function(steps, opt) {
    opt = opt || {};
    if (this.options.steps !== steps) {
      this.options.steps = steps;
      this.options.step = (this.options.end - this.options.start)/this.getSteps();
      this.options.step = this.options.step || 1;
      if (!opt.silent) this.reload();
    }
  },

  getBounds: function() {
    return this.options.bounds;
  },

  getSQL: function() {
    return this.options.sql || "select * from " + this.options.table;
  },

  _tilerHost: function() {
    var opts = this.options;
    var user = (opts.user_name || opts.user);
    return opts.tiler_protocol +
         "://" + (user ? user + "." : "")  +
         opts.tiler_domain +
         ((opts.tiler_port != "") ? (":" + opts.tiler_port) : "");
  },

  _fetchKeySpan: function() {
    this._setReady(true);
  },

  _generateBoundsQuery: function(tiles){
    return tiles.map( function(tile){
      return "(quadkey between (xyz2range("+tile.x+","+tile.y+","+tile.z+")).min and (xyz2range("+tile.x+","+tile.y+","+tile.z+")).max)"
    }).join(" or ")
  },

  getAggregationForTiles: function(varName, agg, tiles, own_filter, callback) {
    var tilesFilter = this._generateBoundsQuery(tiles);
    this.tablesForFilter(tilesFilter, function(tables) {
      // select the table with less than 100k records
      var table = tables.filter(function(f) {
        return f.nrows < 50000 && f.cost < 30000;
      })
      table = table.length ? table[0].table_name: this.options.overview_tables[this.options.overview_tables.length - 1]
      // get multiplicator factor from table name
      var factor = (+_.last(table.split('_')));
      if (agg == 'avg') {
        factor = 1;
      }
      this._getAggregationForTiles(varName, agg, tiles, table, own_filter, factor, callback)
    }.bind(this));
  },

  getHistogramForTiles: function(varName, start, end, bins, tiles, own_filter, callback) {
    var tilesFilter = this._generateBoundsQuery(tiles);
    this.tablesForFilter(tilesFilter, function(tables) {
      // select the table with less than 100k records
      var table = tables.filter(function(f) {
        return f.nrows < 50000 && f.cost < 30000;
      })
      table = table.length ? table[0].table_name: this.options.overview_tables[this.options.overview_tables.length - 1]
      // get multiplicator factor from table name
      var factor = (+_.last(table.split('_')));
      this._getHistogramForTiles(varName, start, end, bins, tiles, table, own_filter, factor, callback)
    }.bind(this));
  },

  categorySearch: function(attr, query, callback) {
    var table = this.options.table.split('_');
    table = table.slice(0, table.length - 1).join('_')
    var sql = format("select category_value as category, category_count as \"value\" from {table}_{varName}_category_statistics where category_value like '{query}%' limit 100", {
      table: table,
      varName: attr,
      query: query
    })

    this.sql(sql, function(data) {
      callback(JSON.parse(data.responseText).rows);
    });
  },

  _getAggregationForTiles : function(varName, agg, tiles, table, own_filter, factor, callback) {
    var sql = [ 'select {agg}({varName}) as result from {table} {tiles} where {bounds} {filters}' ]

    var ff = this._generateFiltersSQL(false, own_filter ? []:  [varName])
    var filters =  ff ? " and " + ff: ""

    var tiles_query = tiles.map(function (t, i) {
      return "xyz2range(" + t.x + "," + t.y + "," + t.z + ") q" + i;
    }).join(',')

    if (tiles_query) {
      tiles_query = "," + tiles_query
    }

    var bounds = tiles.map(function(t, i) {
      return format("(quadkey between q{i}.min and q{i}.max)", { i: i })
    }).join('or')

    if (bounds) {
      bounds = '(' + bounds + ')';
    }

    var query = format(sql.join('\n'), {
      varName: varName,
      table: table,
      tiles: tiles_query,
      filters: filters,
      bounds: bounds,
      agg: agg
    });

    var self = this;
    this.sql(query, function (data) {
      if (data) {
        var rows = JSON.parse(data.responseText).rows;
        // multiply by factor
        callback({ result: rows[0].result * factor, nulls: 0});
      } else {
        callback(null);
      }
    });
  },

  _getHistogramForTiles: function(varName, start, end, bins, tiles, table, own_filter, factor, callback){

    var sql = [
    'with source as (',
       'select {varName} from {table} {tiles} where {bounds} {filters}',
    '),'
    ]
    if (start !== undefined) {
      sql = sql.concat([
        'width as (',
           'select {start} as min,',
                  '{end} as max,',
                  '{bins} as buckets',
        '),'
      ])
    } else {
      start = start === undefined ? 'min(' + varName + ')': start;
      end   = end   === undefined ? 'max(' + varName + ')': end;
      bins  = bins  === undefined ? 50: bins;
      sql = sql.concat([
        'width as (',
           'select {start} as min,',
                  '{end} as max,',
                  '{bins} as buckets',
                  'from source',
        '),'
      ])
    }
    sql = sql.concat([
    '_bw as ( select (max - min)::float8/buckets as bw from width ),',
    'histogram as (',
      'select least(buckets, width_bucket({varName}, min, max, buckets)) - 1 as bucket,',
             'numrange(min({varName})::numeric, max({varName})::numeric, \'[]\') as range,',
             'count(*) as freq',
        'from source, width ',
      'group by bucket',
      'order by bucket',
    ')',
    'select min + bucket*bw as start, min + (bucket+1)*bw as end, bucket as bin, lower(range) as min, upper(range) as max, freq from histogram, _bw, width;'
    ]);

    var ff = this._generateFiltersSQL(false, own_filter ? []:  [varName])
    var filters =  ff ? " and " + ff: ""

    var tiles_query = tiles.map(function (t, i) {
      return "xyz2range(" + t.x + "," + t.y + "," + t.z + ") q" + i;
    }).join(',')

    if (tiles_query) {
      tiles_query = "," + tiles_query
    }

    var bounds = tiles.map(function(t, i) {
      return format("(quadkey between q{i}.min and q{i}.max)", { i: i })
    }).join('or')

    if (bounds) {
      bounds = '(' + bounds + ')';
    }

    var query = format(sql.join('\n'), {
      varName: varName,
      table: table,
      tiles: tiles_query,
      filters: filters,
      bounds: bounds,
      bins: bins,
      start: start,
      end: end
    });

    var self = this;
    this.sql(query, function (data) {
      if (data) {
        var rows = JSON.parse(data.responseText).rows;
        // multiply by factor
        rows.forEach(function(r) {
          r.freq = r.freq * factor;
        })

        callback(rows);
      } else {
        callback(null);
      }
    });
  },

  getCategoriesForTiles: function(varName, tiles, callback){
    var tilesFilter = this._generateBoundsQuery(tiles);
    this.tablesForFilter(tilesFilter, function(tables) {
      // select the table with less than 100k records
      var table = tables.filter(function(f) {
        return f.nrows < 50000 && f.cost < 30000;
      })
      table = table.length ? table[0].table_name: this.options.overview_tables[this.options.overview_tables.length - 1]
      var factor = (+_.last(table.split('_')));
      this._getCategoriesForTiles(varName, tiles, table, factor, callback)
    }.bind(this));
  },

  _getCategoriesForTiles: function(varName, tiles, table, factor, callback){

    /*var sql = [
    'SELECT CAST(category AS text), value, false as agg, nulls_count, min_val, max_val, count, categories_count',
    '  FROM categories, summary, categories_summary',
    '  WHERE rank < {{=it._limit}}',
    'UNION ALL',
    'SELECT \'Other\' category, sum(value), true as agg, nulls_count, min_val, max_val, count, categories_count',
    '  FROM categories, summary, categories_summary',
    '  WHERE rank >= {{=it._limit}}',
    'GROUP BY nulls_count, min_val, max_val, count, categories_count'
    ]*/

    var sql = [
      'select {varName} category, count(1) as "value" from {table} {tiles} where {bounds} {filters} group by 1 order by 2 desc limit {num_cats}',
    ]

    var filters = this._generateFiltersSQL(false, [varName]) ?  " and "+ this._generateFiltersSQL(false, [varName]) : ""

    var tiles_query = tiles.map(function (t, i) {
      return "xyz2range(" + t.x + "," + t.y + "," + t.z + ") q" + i;
    }).join(',')

    if (tiles_query) {
      tiles_query = "," + tiles_query
    }

    var bounds = tiles.map(function(t, i) {
      return format("(quadkey between q{i}.min and q{i}.max)", { i: i })
    }).join('or')

    if (bounds) {
      bounds = '(' + bounds + ')';
    }

    var query = format(sql.join('\n'), {
      varName: varName,
      table: table,
      filters: filters,
      tiles: tiles_query,
      bounds: bounds,
      num_cats: 20
    });

    var self = this;
    this.sql(query, function (data) {
      if (data) {
        var rows = JSON.parse(data.responseText).rows;
        rows.forEach(function(r) {
          r.value = factor * r.value;
        });
        callback(rows);
      } else {
        callback(null);
      }
    });
  },


  tablesForFilter: function(filter, callback) {
    var filters = this._generateFiltersSQL()
    if (filters) {
      filters = "(" + filters + ") AND (" + filter + ")";
    } else {
      filters = filter;
    }
    // calcualte the table to fecth the histogram
    // use the tile 0,0,0 using the quadkey range query
    var sql = format("SELECT * FROM selectivity(x:=0, y:=0, z:=0, tables:=ARRAY[{overview_tables}], where_clause:='{filters}') order by nrows desc", {
        overview_tables: this.options.overview_tables.map(function(t) { return "'" + t + "'"; }).join(','),
        filters: filters
    });
    this.sql(sql, function(data) {
      callback(JSON.parse(data.responseText).rows);
    });
  }

};

L.TorqueLayer.prototype.providers['filterable_sql_api'] = filterableJson;
