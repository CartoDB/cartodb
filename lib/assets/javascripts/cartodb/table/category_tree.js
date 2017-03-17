cdb.admin.CategoryTree = cdb.core.Model.extend({
  _rootId: -1,
  _categories: undefined,

  initialize: function(attrs, opts) {
    this._rootId = attrs.rootId;
    this.user = attrs.user;
    this.reset();
  },

  reset: function() {
    this._categories = { children: [] };
  },

  _findCategory: function(parent, id) {
    if (id === this._rootId) {
      return this._categories;
    }
    var i, numChildren = parent.children.length;
    for (i = 0; i <  numChildren; ++i) {
      if (parent.children[i].id == id) {
        return parent.children[i];
      }
    }
    for (i = 0; i <  numChildren; ++i) {
      var category = this._findCategory(parent.children[i], id);
      if (category) {
        return category;
      }
    }
    return undefined;
  },

  createFromArray: function(categoryArray) {
    this.reset();
    var items = categoryArray;
    var i, numItems = items.length, item;
    for (i = 0; i < numItems; ++i) {
        item = items[i];
        var parentCategory = this._findCategory(this._categories, item.parent_id);
        if (parentCategory) {
          parentCategory.children.push({ id: item.id, name: item.name, parent_id: item.parent_id, list_order: item.list_order, children: [] });
        }
    }
  },

  load: function(callbackContext, onSuccess, onError) {
    var self = this;
    $.ajax({
      url: window.location.origin + '/user/' + this.user.get('username') + '/api/v1/viz/subcategories/?category_id=' + self._rootId
    })
    .done(function(response) {
      self.createFromArray(response);
      if (onSuccess) {
        onSuccess.call(callbackContext);
      }
    })
    .fail(function() {
      if (onError) {
        onError.call(callbackContext);
      }
    });
  },

  getChildCategories: function(id) {
    var category = this._findCategory(this._categories, id);
    if (category) {
      return category.children;
    }
    return [];
  },

  getCategory: function(id) {
    var category = this._findCategory(this._categories, id);
    if (category) {
      return category;
    }
    return undefined;
  }
});