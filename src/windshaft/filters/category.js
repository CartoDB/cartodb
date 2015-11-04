cdb.windshaft.filters.CategoryFilter = cdb.windshaft.filters.FilterBase.extend({

  initialize: function() {
    this.acceptedCategories = new Backbone.Collection();
    this.rejectedCategories = new Backbone.Collection();
  },

  isEmpty: function() {
    return this.acceptedCategories.size() === 0 && this.rejectedCategories.size() === 0;
  },

  accept: function(values) {
    var arr = [];
    _.each(values, function(value) {
      var mdls = this.rejectedCategories.where({ name: value });
      if (mdls.length > 0) {
        arr.push(mdls[0]);
      }
    }, this);
    this.rejectedCategories.remove(arr);
    this.trigger('change', this);
  },

  acceptAll: function() {
    this.rejectedCategories.reset();
    this.trigger('change', this);
  },

  hasAccepts: function() {
    return this.acceptedCategories.size() > 0;
  },

  reject: function(values) {
    var arr = [];
    _.each(values, function(value) {
      if (this.rejectedCategories.where({ name: value }).length === 0) {
        arr.push({ name: value });
      }
    }, this);
    this.rejectedCategories.add(arr);
    this.trigger('change', this);
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
    if (this.acceptedCategories.size() > 0) {
      json[this.get('widgetId')].accept = _.pluck(this.acceptedCategories.toJSON(), 'name');
    }
    return json;
  }
});
