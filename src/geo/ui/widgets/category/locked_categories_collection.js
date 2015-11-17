var _ = require('underscore');
var Backbone = require('backbone');
var CategoryItemModel = require('./category_item_model');

/**
 * Locked categories collection
 */

module.exports = Backbone.Collection.extend({

  model: CategoryItemModel,

  initialize: function() {
    this.bind('change add remove reset', function() {
      console.log(this.toJSON(), this.size());
    })
  },

  addItem: function(mdl) {
    if (!this.isItemLocked(mdl.get('name'))) {
      this.add(mdl);
    }
  },

  addItems: function(mdls) {
    this.reset(mdls);
  },

  removeItem: function(mdl) {
    var lockedItem = this.isItemLocked(mdl.get('name'));
    if (lockedItem) {
      this.remove(lockedItem);
    }
  },

  removeItems: function() {
    this.reset([]);
  },

  isItemLocked: function(name) {
    return this.find(function(d) {
      return d.get('name') === name;
    });
  }

});
