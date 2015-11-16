var Model = require('cdb/core/model');

/**
 *  View model, special for widgets with search
 *  functionality
 */
module.exports = Model.extend({

  defaults: {
    search: false
  },

  toggleSearch: function() {
    this.set('search', !this.get('search'));
  },

  enableSearch: function() {
    this.set('search', true);
  },

  disableSearch: function() {
    this.set('search', false);
  },

  isSearchEnabled: function() {
    return this.get('search');
  }

});
