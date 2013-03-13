cdb.admin.models = cdb.admin.models || {};

//===================================================
// histogram filter
//===================================================
cdb.admin.models.Filter = cdb.core.Model.extend({

  DEFAULT_HIST_BUCKETS: 20,
  urlRoot: '/api/v1/filters',

  initialize: function() {
    this.table = this.get('table');
    if(!this.table) {
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
      if(hist) {
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
  }

});

//===================================================
// discrete filter for text columns
//===================================================
cdb.admin.models.FilterDiscrete = cdb.core.Model.extend({

  DEFAULT_HIST_BUCKETS: 20,
  urlRoot: '/api/v1/filters',

  initialize: function() {
    this.table = this.get('table');
    this.items = new Backbone.Collection();
    if(!this.table) {
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
      if(hist) {
        self._updateHist(hist);
      } else {
        self.trigger('error', "histogram couldn't be generated");
      }
    });
  },

  _updateHist: function(hist) {
    this.items.reset(hist);
    this.items.each(function(i) {
      i.set('selected', true);
    });
  },

  getSQLCondition: function() {
    return _.template(" (<%= column %> IN (<%= opts %>)) ")({
      column: this.get('column'),
      opts: this.items
      .filter(function(i) {
        return i.get('selected');
      })
      .map(function(i) {
        return "'" + i.get('bucket') + "'";
      }).join(',')
    });
  }
});

//===================================================
// filters collection
//===================================================
cdb.admin.models.Filters = Backbone.Collection.extend({

  model: cdb.admin.models.Filter,

  getSQLCondition: function() {
    var sql = this.map(function(f) {
      return f.getSQLCondition();
    }).join(' AND ');
    return sql;
  }

});
