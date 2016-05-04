cdb.admin.models = cdb.admin.models || {};

cdb.admin.models.CategoricalOperation = cdb.core.Model.extend({

});

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

    this.table.originalData().histogram(this.DEFAULT_HIST_BUCKETS, this.get('column'), function(hist, bounds) {

      if (hist) {
        self._changeHist(hist, bounds);
      } else {
        self.trigger('error', "numeric histogram couldn't be generated");
      }
    });

  },

  _fetchDateHist: function() {
    var self = this;

    this.table.originalData().date_histogram(this.DEFAULT_HIST_BUCKETS, this.get('column'), function(hist, bounds) {

      if (hist) {
        self._changeDateHist(hist, bounds);
      } else {
        self.trigger('error', "date histogram couldn't be generated");
      }
    });

  },

  _changeDateHist: function(hist, bounds) {

    var previousBounds = this.get('bounds');

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
        'upper_limit': bounds.upper,
        'tz': bounds.tz
      });

    } else {

      var lower = Math.max(bounds.lower * 1000, this.get("lower"));
      var upper = Math.min(bounds.upper * 1000, this.get("upper"));

      // Bounds have changed
      if (previousBounds) {

        // Bounds have been expanded on the upper side
        if (bounds.upper > previousBounds.upper) {
          upper = bounds.upper * 1000;
        }

        // Bounds have been expanded on the lower side
        if (bounds.lower < previousBounds.lower) {
          lower = bounds.lower * 1000;
        }
      }

      if (_.isNaN(lower) || _.isNaN(upper)) {
        lower = bounds.lower * 1000;
        upper = bounds.upper * 1000;
      }

      this.set({
        'lower': lower,
        'upper': upper,
        'lower_limit': bounds.lower * 1000,
        'upper_limit': bounds.upper * 1000,
        'tz': bounds.tz
      });

    }

  },

  _changeHist: function(hist, bounds) {

    var previousBounds = this.get('bounds');

    this.set('hist', hist, { silent: true });
    this.set('bounds', bounds, { silent: true });

    if (!this.has('lower')) {

      // calculate limits based on partitions
      var per_bar  = bounds.bucket_size;

      bounds.upper = per_bar * Math.ceil(bounds.upper/per_bar);

        this.set({
          'bucket_size': per_bar,
          'lower': bounds.lower,
          'upper': bounds.upper,
          'lower_limit': bounds.lower,
          'upper_limit': bounds.upper
        });

    } else {

      var upper = Math.min(bounds.upper, this.get('upper'));
      var lower = Math.max(bounds.lower, this.get('lower'));

      // Bounds have changed
      if (previousBounds) {

        // Bounds have been expanded on the upper side
        if (bounds.upper > previousBounds.upper) {
          upper = bounds.upper;
        }

        // Bounds have been expanded on the lower side
        if (bounds.lower < previousBounds.lower) {
          lower = bounds.lower;
        }
      }

      this.set({
        'lower': lower,
        'upper': upper,
        'lower_limit': bounds.lower,
        'upper_limit': bounds.upper
      });

    }

  },

  _getDateFromTimestamp: function(timestamp) {
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

  /**
   *  Extracts the timezone from a date
   */
  _getTimeZone: function(date) {
    if (date) {
      return new Date(date).getTimezoneOffset()
    }
    return 0;
  },

  getSQLConditionForDate: function() {

    var lower = this.get("lower");
    var upper = this.get("upper");

    if (_.isNaN(lower) || _.isNaN(upper) || lower == undefined || upper == undefined) return null;

    var lowerDateWithOffset = moment(lower).format("YYYY-MM-DDTHH:mm:ssZ").toString();
    var upperDateWithOffset = moment(upper).format("YYYY-MM-DDTHH:mm:ssZ").toString();

    var attributes = _.clone(this.attributes);

    var options, sql;

    if (this.get('upper') >= this.get('upper_limit')) {
      options = _.extend(attributes, {
        lower: lowerDateWithOffset,
        upper: moment(this.get('upper_limit')).format("YYYY-MM-DDTHH:mm:ssZ").toString()
      });
      sql = _.template(" (<%= column %> >= ('<%= lower %>') AND <%= column %> <= ('<%= upper %>')) ")(options);

    } else {

      options = _.extend(attributes, { lower: lowerDateWithOffset, upper: upperDateWithOffset});
      sql = _.template(" (<%= column %> >= ('<%= lower %>') AND <%= column %> <= ('<%= upper %>')) ")(options);

    }

    return sql;

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
      tz:     this.get('tz'),
      column_type:   this.get('column_type')
    }
  }

});

//===================================================
// discrete filter for text columns
//===================================================
cdb.admin.models.FilterDiscrete = cdb.core.Model.extend({

  DEFAULT_HIST_BUCKETS: 65,
  urlRoot: '/api/v1/filters',

  defaults: {
    list_view: true
  },

  initialize: function() {

    this.table = this.get('table');
    this.items = new Backbone.Collection();
    this.operations = new Backbone.Collection();

    if (this.get('items')) {
      this.items.reset(this.get('items'));
    }

    if (this.get('operations')) {
      this.operations.reset(this.get('operations'));
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

    this.operations.bind('change', function() {
      this.trigger('change', this)
      this.trigger('change:operations', this, this.operations);
    }, this);
    this.operations.bind('add', function () {
      this.trigger('add', this);
      this.trigger('add:operations', this, this.operations);
    }, this);
    this.operations.bind('remove', function () {
      this.trigger('remove', this);
      this.trigger('remove:operations', this, this.operations);
    }, this);

    this._fetchHist();

  },

  _fetchHist: function() {
    var self = this;

    this.table.originalData().discreteHistogram(this.DEFAULT_HIST_BUCKETS, this.get('column'), function(hist) {

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

  _containsNull: function(items) {

    var containsNull = false;

    _.each(items, function(bucket) {
      if (!bucket.get("bucket")) containsNull = true;
    });

    return containsNull;

  },

  _nullIsNotSelected: function(origin, destiny) {
    var difference = _.difference(origin, destiny);

    var nullIsNotSelected = false;

    _.each(difference, function(bucket) {
      if (!bucket.get("selected") && !bucket.get("bucket")) nullIsNotSelected = true;
    });

    return nullIsNotSelected;

  },

  getSQLConditionForString: function() {

    var that = this;
    var templates = {
      'BEGINSWITH': "<%= column %> ILIKE '<%= text %>%'",
      'ENDSWITH': "<%= column %> ILIKE '%<%= text %>'",
      'CONTAINS': "<%= column %> ILIKE '%<%= text %>%'",
      'EQUALS': "<%= column %> = '<%= text %>'"
    };

    // If the user entered text…
    if (!this.get("list_view")) {

      if (!this.operations.isEmpty()) {

        var where = this.operations.reduce(function (sql, m, index) {
          var text = that._sanitize(m.get('text'));
          var templateString = templates[m.get('operation')];
          if (!templateString) {
            throw 'SQLCondition template key must match one of OperationView.OPERATIONS';
          }
          var clause = _.template(templateString)({
            column: that.get('column'),
            text: text
          });
          // Add operator if not the first operation
          if (index > 0) {
            clause = ' ' + m.get('operator') + ' ' + clause;
          }
          return sql += clause;
        }, '');
        // Add parens if more than one operation on this field
        return this.operations.models.length > 1 ? '(' + where + ')' : where;
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

      var selected = items.filter(function(i) { return i.get('selected'); });

      if (items.length == this.items.length) {

        return _.template(" (true) ")({
          column: this.get('column'),
          opts: items.map(function(i) {
            var bucket = that._sanitize(i.get('bucket'));
            return "'" + bucket + "'";
          }).join(',')
        });

      } else {

        var query = "<%= column %> IN (<%= opts %>) ";

        if (this._nullIsNotSelected(this.items.models, items)) {
          query = "<%= column %> IN (<%= opts %>) AND <%= column %> IS NOT NULL "
        } else if (this._containsNull(items)) {
          query = "<%= column %> IN (<%= opts %>) OR <%= column %> IS NULL ";
        }

        return _.template(query)({
          column: this.get('column'),
          opts: items.map(function(i) {
            var bucket = that._sanitize(i.get('bucket'));

            return "'" + bucket + "'";
          }).join(',')
        });

      }

    } else { // if there's no selected element…

      return ' (true) '; // this will remove the 'WHERE' condition

    }

    // If there aren't selected items
    return "true ";

  },

  toJSON: function() {
    return {
      reached_limit: this.get("reached_limit"),
      column:        this.get('column'),
      items:         this.items.toJSON(),
      operations:    this.operations.toJSON(),
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
    var col  = attrs.column;

    var schema = self.table.get("original_schema") ? "original_schema": "schema";

    var column_type = self.table.getColumnType(col, schema) || attrs.column_type;
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
    if (!options.dataLayer) {
      throw "Filters need a dataLayer";
    }
    this.dataLayer = options.dataLayer;
  },

  getSQLCondition: function() {

    var sqls = this.map(function(f) {
      return f.getSQLCondition();
    })

    var operator = this.dataLayer.get('sql_or_toggle') ? ' OR ' : ' AND ';
    var sql = _(sqls).compact().join(operator);

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
