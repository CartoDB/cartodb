cdb.geo.ui.Widget.CategoryModel = cdb.geo.ui.Widget.Model.extend({

  initialize: function(attrs, opts) {
    if (opts.filter) {
      this.filter = opts.filter;
    }
    this._data = new Backbone.Collection(this.get('data'));
    cdb.geo.ui.Widget.Model.prototype.initialize.call(this);
  },

  getData: function() {
    return this._data;
  },

  getSize: function() {
    return this._data.size();
  },

  toJSON: function() {
    return {
      type: "aggregation",
      options: {
          column: this.get('column'),
          aggregation: this.get('aggregation')
      }
    };
  },

  parse: function(data) {
    var categories = data.categories;
    var columnName = this.get('column');
    var maxCount = categories.reduce(function(memo, datum) {
      return memo + datum.count;
    }, 0);

    // Add rejected categories + result categories
    var rejectedCategories = _.clone(this.filter.rejectedCategories);
    var rejectedData = _.map(rejectedCategories, function(category){
      return {
        'selected': false,
        'name': category,
        'count': 0,
        'maxCount': 0
      };
    }, this);

    var newData = _.map(categories, function(datum) {
      return {
        'selected': true,
        'name': datum[columnName],
        'count': datum.count,
        'maxCount': maxCount
      };
    }, this);

    newData = newData.concat(rejectedData);
    newData = _.sortBy(newData, function(datum) {
      return datum.name;
    });

    this._data.reset(newData);

    return {
      data: newData
    };
  }
});
