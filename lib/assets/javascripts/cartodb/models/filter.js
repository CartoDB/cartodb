
cdb.admin.models = cdb.admin.models || {};

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
    this.table.data().histogram(this.DEFAULT_HIST_BUCKETS, this.get('column'), function(hist) {
      self.set('hist', hist);
      if(!self.has('lower')) {
        self.set('lower', hist.lower);
        self.set('upper', hist.upper);
      } else {
        self.set({
          'lower': Math.max(hist.lower, self.get('lower')),
          'upper': Math.min(hist.upper, self.get('upper'))
        });
      }
    });
  },

  getSQLCondition: function() {
    return _.template(" (<%= column %> >= <%= lower %> AND <%= column %> <= <%= upper %>) ")(this.attributes);
  }


});

cdb.admin.models.Filters = Backbone.Collection.extend({
  model: cdb.admin.models.Filter
});
