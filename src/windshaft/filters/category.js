cdb.windshaft.filters.CategoryFilter = cdb.windshaft.filters.FilterBase.extend({

  initialize: function() {
    this.rejectedCategories = new Backbone.Collection();
  },

  isEmpty: function() {
    return this.rejectedCategories.size() === 0;
  },

  accept: function(values) {
    values = !_.isArray(values) ? [values] : values;
    var arr = [];
    _.each(values, function(value) {
      var mdls = this.rejectedCategories.where({ name: value });
      if (mdls.length > 0) {
        arr.push(_.first(mdls));
      }
    }, this);
    if (arr.length > 0) {
      this.rejectedCategories.remove(arr);
      this.trigger('change', this);
    }
  },

  acceptAll: function() {
    this.rejectedCategories.reset();
    this.trigger('change', this);
  },

  getRejected: function() {
    return this.rejectedCategories;
  },

  reject: function(values) {
    values = !_.isArray(values) ? [values] : values;
    var arr = [];
    _.each(values, function(value) {
      if (this.rejectedCategories.where({ name: value }).length === 0) {
        arr.push({ name: value });
      }
    }, this);
    if (arr.length > 0) {
      this.rejectedCategories.add(arr);
      this.trigger('change', this);
    }
  },

  hasRejects: function() {
    return this.rejectedCategories.size() > 0;
  },

  toJSON: function() {
    var json = {};
    json[this.get('widgetId')] = {};
    if (this.rejectedCategories.size() > 0) {
      json[this.get('widgetId')].reject = _.pluck(this.rejectedCategories.toJSON(), 'name');
    }
    return json;
  }
});
