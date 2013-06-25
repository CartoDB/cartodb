cdb.admin.models = cdb.admin.models || {};

//===================================================
// histogram filter
//===================================================
cdb.admin.models.Filter = cdb.core.Model.extend({

  DEFAULT_HIST_BUCKETS: 100,
  urlRoot: '/api/v1/filters',

  initialize: function() {

    this.table = this.get('table');

    if (!this.table) {
      throw "Filter needs a table";
    }

    this.unset('table');

    this.table.bind('data:saved', function() {
      this._fetchHist();
    }, this);

    if(this.table.has('name') && this.table.has('schema')) {
      this._fetchHist();
    }
    this.table.bind('change:name change:schema', this._fetchHist, this);
    this.bind('destroy', function() {
      this.table.unbind('change:name change:schema', this._fetchHist, this);
    });
  },

  _fetchHist: function() {

    if (this.get("column_type") == 'date') this._fetchDateHist();
    else this._fetchNumericHist();

  },

  _fetchNumericHist: function() {
    var self = this;

    this.table.data().histogram(this.DEFAULT_HIST_BUCKETS, this.get('column'), function(hist, bounds) {

      if (hist) {
        self._changeHist(hist, bounds);
      } else {
        self.trigger('error', "numeric histogram couldn't be generated");
      }
    });

  },

  _fetchDateHist: function() {
    var self = this;

    this.table.data().date_histogram(this.DEFAULT_HIST_BUCKETS, this.get('column'), function(hist, bounds) {

      if (hist && bounds && hist != NaN && bounds != NaN) {
        self._changeDateHist(hist, bounds);
      } else {
        self.trigger('error', "date histogram couldn't be generated");
      }
    });

  },

  _changeDateHist: function(hist, bounds) {

    console.log("_changeDataHist", hist, bounds);

    this.set('hist',   hist,   { silent: true });
    this.set('bounds', bounds, { silent: true });

    if (!this.has('lower')) {

      var per_bar = bounds.bucket_size;

      bounds.lower = Math.round(bounds.lower * 1000);
      bounds.upper = Math.round(bounds.upper * 1000);

      this.set({
        'bucket_size': per_bar,
        'lower': bounds.lower,
        'upper': bounds.upper,
        'lower_limit': bounds.lower,
        'upper_limit': bounds.upper
      });

      console.log(1, hist, bounds);

    } else {

      var lower = this.get("lower");
      var upper = this.get("upper");

      console.log("changeDataHist", lower, upper);

      if (typeof lower == 'string') {
        var lower = parseInt(new Date(this.get("lower")).getTime(), 10);
      }

      if (typeof upper == 'string') {
        var upper = parseInt(new Date(this.get("upper")).getTime(), 10);
      }

      console.log(2, lower, this.get("lower"), upper, this.get("upper"));

      this.set({
        'lower': Math.max(bounds.lower * 1000, lower),
        'upper': Math.min(bounds.upper * 1000, upper),
        'lower_limit': bounds.lower * 1000,
        'upper_limit': bounds.upper * 1000
      });

    }

  },

  _changeHist: function(hist, bounds) {

    this.set('hist', hist, { silent: true });
    this.set('bounds', bounds, { silent: true });

    if (!this.has('lower')) {
      // calculate limits based on partitions
      /*var span = bounds.upper - bounds.lower;
        var per_bar = span/this.DEFAULT_HIST_BUCKETS;
        per_bar = Math.max(1, 10*Math.ceil(Math.log(per_bar)/Math.log(10)))
      //bounds.lower = per_bar*Math.floor(bounds.lower/per_bar)
      */
      var per_bar = bounds.bucket_size
        bounds.upper = per_bar*Math.ceil(bounds.upper/per_bar)

        this.set({
          'bucket_size': per_bar,
          'lower': bounds.lower,
          'upper': bounds.upper,
          'lower_limit': bounds.lower,
          'upper_limit': bounds.upper
        });

    } else {

      this.set({
        'lower': Math.max(bounds.lower, this.get('lower')),
        'upper': Math.min(bounds.upper, this.get('upper')),
        'lower_limit': bounds.lower,
        'upper_limit': bounds.upper
      });

    }

  },

  _getDateFromTimestamp: function(timestamp) {
    console.log("Timestamp", timestamp);
    return new Date(timestamp);
  },

  interpolate: function(t) {
    var a = this.get('lower_limit');
    var b = this.get('upper_limit');
    return (1 - t)*a + t*b;
  },

  fitToBucket: function(value) {
    var b = this.get('bucket_size');
    if (!b) return 0;
    return b*Math.floor(value/b);
  },

  getSQLCondition: function() {

    if (this.attributes.column_type == 'date') return this.getSQLConditionForDate();
    else return this.getSQLConditionForNumber();

  },

  getSQLConditionForDate: function() {

    var lowerDate = this._getDateFromTimestamp(this.get("lower"));
    var upperDate = this._getDateFromTimestamp(this.get("upper"));

    var options = _.extend(this.attributes, { lower: lowerDate.toUTCString(), upper: upperDate.toUTCString() });

    if (!this.attributes.lower && !this.attributes.upper) return _.template(" (<%= column %> IS NULL) ")(options);
    if (this.attributes.upper >= this.attributes.upper_limit) return _.template(" (<%= column %> >= ('<%= lower %>') AND <%= column %> <= ('<%= upper %>')) ")(options);
    return _.template(" (<%= column %> >= ('<%= lower %>') AND <%= column %> <= ('<%= upper %>')) ")(options);

  },

  getSQLConditionForNumber: function() {
    if (!this.attributes.lower && !this.attributes.upper) return _.template(" (<%= column %> IS NULL) ")(this.attributes);
    if (this.attributes.upper >= this.attributes.upper_limit) return _.template(" (<%= column %> >= <%= lower %> AND <%= column %> <= <%= upper %>) ")(this.attributes);
    return _.template(" (<%= column %> >= <%= lower %> AND <%= column %> < <%= upper %>) ")(this.attributes);
  },

  toJSON: function() {

    return {
      column: this.get('column'),
      upper:  this.get('upper'),
      lower:  this.get('lower'),
      column_type:   this.get('column_type')
    }
  }

});

//===================================================
// discrete filter for text columns
//===================================================
cdb.admin.models.FilterDiscrete = cdb.core.Model.extend({

  DEFAULT_HIST_BUCKETS: 39,
  urlRoot: '/api/v1/filters',

  defaults: {
    list_view: true
  },

  initialize: function() {

    this.table = this.get('table');
    this.items = new Backbone.Collection();

    if (this.get('items')) {
      this.items.reset(this.get('items'));
    }

    if (!this.table) {
      throw "Filter needs a table";
    }

    this.unset('table');

    this.table.bind('data:saved', function() {
      this._fetchHist();
    }, this);

    this.items.bind('change', function() {
      this.trigger('change', this)
      this.trigger('change:items', this, this.items);
    }, this);

    this._fetchHist();

  },

  _fetchHist: function() {
    var self = this;

    this.table.data().discreteHistogram(this.DEFAULT_HIST_BUCKETS, this.get('column'), function(hist) {

      if (hist) {
        self._updateHist(hist);
      } else {
        self.trigger('error', "Histogram couldn't be generated");
      }

    });
  },

  _updateHist: function(hist) {

    for (var i = 0; i < hist.rows.length; ++i) {

      var o = this.items.where({ bucket: hist.rows[i].bucket})

        if (o.length) {
          hist.rows[i].selected = o[0].get('selected')
        } else {
          hist.rows[i].selected = true;
        }

    }

    this.set("reached_limit", hist.reached_limit);
    this.items.reset(hist.rows);

  },

  _sanitize: function(s) {
    if (s) {
      return s.replace(/'/g, "''");
    }

    return s;
  },

  getSQLCondition: function() {

    if (this.get("column_type") == 'boolean') return this.getSQLConditionForBoolean();
    else return this.getSQLConditionForString();

  },

  getSQLConditionForBoolean: function() {

    if (this.items.size() === 0) { // if there aren't any items…
      return ' (true) ';
    }

    // Make some lists of values
    var selected_items            = this.items.filter(function(i) { return i.get('selected'); });
    var true_false_selected_items = this.items.filter(function(i) { return i.get('bucket') != null && i.get('selected'); });
    var null_selected_items       = this.items.filter(function(i) { return i.get('bucket') == null && i.get('selected'); });

    if (selected_items.length > 0 && null_selected_items.length == 0) { // there are just true or false values

      return _.template("<%= column %> IN (<%= opts %>) ")({
        column: this.get('column'),
             opts: true_false_selected_items.map(function(i) {
               return i.get("bucket");
             }).join(',')
      });

    }

    if (selected_items.length == 1 && null_selected_items.length == 1) { // only null values

      return _.template("<%= column %> IS NULL ")({
        column: this.get('column')
      });

    }

    if (selected_items.length > 0) {

      return _.template("<%= column %> IN (<%= opts %>) OR <%= column %> IS NULL ")({ // all kinds of values
        column: this.get('column'),
             opts: true_false_selected_items.map(function(i) {
               return i.get("bucket");
             }).join(',')
      });

    }

    return _.template("<%= column %> IN (NULL) ")({ // there aren't any selected values
      column: this.get('column'),
    });


  },

  getSQLConditionForString: function() {

    var that = this;

    // If the user entered text…
    if (!this.get("list_view")) {

      if (this.get("free_text")) {

        var text = this._sanitize(this.get("free_text"));

        return _.template("<%= column %> ILIKE '%<%= t %>%' ")({
          column: this.get('column'),
               t: text
        });

      } else {
        return ' (true) ';
      }

    }

    // If there aren't any items…
    if (this.items.size() === 0) {
      return ' (true) ';
    }

    // If there are some items, first get the selected ones…
    var items = this.items.filter(function(i) {
      return i.get('selected');
    });

    // If there are selected items…
    if (items.length > 0) {

      return _.template("(COALESCE(<%= column %>, 'null') IN (<%= opts %>)) ")({
        column: this.get('column'),
             opts: items.map(function(i) {
               var bucket = that._sanitize(i.get('bucket'));
               return "'" + bucket + "'";
             }).join(',')
      });

    } else {

      return _.template("<%= column %> IN (NULL) ")({
        column: this.get('column'),
      });

    }

    // If there aren't selected items
    return "true ";

  },

  toJSON: function() {
    return {
      reached_limit: this.get("reached_limit"),
      column:        this.get('column'),
      items:         this.items.toJSON(),
      free_text:     this.get("free_text"),
      list_view:     this.get("list_view"),
      column_type:   this.get('column_type')
    }
  }
});

//===================================================
// filters collection
//===================================================
cdb.admin.models.Filters = Backbone.Collection.extend({

  model: function(attrs, options) {
    var self = options.collection;
    var col = attrs.column;
    var column_type = self.table.getColumnType(col, self.table.isInSQLView() ? "original_schema": "schema") || attrs.column_type;
    var FilterClass = self._getFilterModelforColumnType(column_type);
    return new FilterClass(_.extend(attrs, {
      column_type: column_type,
           table: self.table
    }));
  },

  initialize: function(m, options) {
    if (!options.table) {
      throw "Filters need a table";
    }
    this.table = options.table;
  },

  getSQLCondition: function() {

    var sql = this.map(function(f) {
      return f.getSQLCondition();
    }).join(' AND ');

    return sql;
  },

  removeFilters: function() {
    while(this.size()) {
      this.at(0).destroy();
    }
  },

  _getFilterModelforColumnType: function(columnType) {
    if (columnType == 'number' || columnType == 'date') {
      return cdb.admin.models.Filter;
    } else {
      return cdb.admin.models.FilterDiscrete
    }
  }


});
