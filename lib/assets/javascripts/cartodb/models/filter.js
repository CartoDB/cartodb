cdb.admin.models = cdb.admin.models || {};

//===================================================
// histogram filter
//===================================================
cdb.admin.models.Filter = cdb.core.Model.extend({

  DEFAULT_HIST_BUCKETS: 20,
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

    this._fetchHist();

  },

  _fetchHist: function() {
    var self = this;
    this.table.data().histogram(this.DEFAULT_HIST_BUCKETS, this.get('column'), function(hist, bounds) {

      if (hist) {
        self._changeHist(hist, bounds);
      } else {
        self.trigger('error', "histogram couldn't be generated");
      }
    });

  },

  _changeHist: function(hist, bounds) {

    this.set('hist', hist, { silent: true });
    this.set('bounds', bounds, { silent: true });

    if (!this.has('lower')) {

      this.set({
        'lower': bounds.lower,
        'upper': bounds.upper,
        'lower_limit': bounds.lower,
        'upper_limit': bounds.upper
      });

    } else {
      this.set({
        'lower': Math.max(bounds.lower, this.get('lower')),
        'upper': Math.min(bounds.upper, this.get('upper'))
      });
    }
  },

  interpolate: function(t) {
    return this.get('lower_limit')  + t*(this.get('upper_limit') - this.get('lower_limit'));
  },

  getSQLCondition: function() {
    return _.template(" (<%= column %> >= <%= lower %> AND <%= column %> <= <%= upper %>) ")(this.attributes);
  },

  toJSON: function() {
    return {
      column: this.get('column'),
      upper: this.get('upper'),
      lower: this.get('lower')
    }
  }

});

//===================================================
// discrete filter for text columns
//===================================================
cdb.admin.models.FilterDiscrete = cdb.core.Model.extend({

  DEFAULT_HIST_BUCKETS: 20,
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

  getSQLCondition: function() {

    if (this.get("free_text")) {

      return _.template("<%= column %> ILIKE '%<%= t %>%' ")({
        column: this.get('column'),
        t: this.get("free_text")
      })

    }

    if (this.items.size() === 0) {
      return ' (false) '
    }

    var items = this.items.filter(function(i) {
      return i.get('selected');
    });

    if (items.length > 0) {

      return _.template("(<%= column %> IN (<%= opts %>)) ")({
        column: this.get('column'),
        opts: items
        .map(function(i) {
          return "'" + i.get('bucket') + "'";
        }).join(',')
      });

    } else {
      return "true ";
    }

  },

  toJSON: function() {
    return {
      reached_limit: this.get("reached_limit"),
      column:        this.get('column'),
      items:         this.items.toJSON()
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
    var column_type = self.table.getColumnType(col);
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
    if (columnType == 'number') {
      return cdb.admin.models.Filter;
    } else {
      return cdb.admin.models.FilterDiscrete
    }
  }


});
