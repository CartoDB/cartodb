cdb.windshaft.filters.CategoryFilter = cdb.windshaft.filters.FilterBase.extend({

  initialize: function() {
    this.rejectedCategories = [];
  },

  isEmpty: function() {
    return this.rejectedCategories.length === 0;
  },

  accept: function(value) {
    if (this.contains(value)) {
      var index = this.rejectedCategories.indexOf(value);
      if (index >= 0) {
        this.rejectedCategories.splice(index, 1);
      }
    }

    this.trigger('change', this);
  },

  reject: function(value) {
    if (!this.contains(value)) {
      this.rejectedCategories.push(value);
    }

    this.trigger('change', this);
  },

  contains: function(value) {
    return this.rejectedCategories.indexOf(value) >= 0;
  },

  toJSON: function() {
    var json = {};
    json[this.get('widgetId')] = { reject: this.rejectedCategories };

    return json;
  }
});

