cdb.geo.ui.Widget.CategoryModel = cdb.geo.ui.Widget.Model.extend({

  defaults: {
    data: [],
    columns: []
  },

  initialize: function() {
    this.filter = new cdb.windshaft.filters.CategoryFilter();
    this._data = new Backbone.Collection(this.get('data'));
    cdb.geo.ui.Widget.Model.prototype.initialize.call(this);
  },

  getData: function() {
    return this._data;
  },

  getSize: function() {
    return this._data.size();
  },

  parse: function(data) {
    var categories = data.categories;
    var columnName = this.get('options').column;
    var maxCount = categories.reduce(function(memo, datum) {
      return memo + datum.count;
    }, 0);

    var newData = _.map(categories, function(datum) {
      return {
        'selected': true,
        'name': datum[columnName],
        'count': datum.count,
        'maxCount': maxCount
      };
    }, this);

    this._data.reset(newData);

    return {
      data: newData
    };
  }
});
