var cdb = require('cartodb.js');

/**
 *  View model, special for widgets with search and collapse
 *  functionalities
 *
 */

module.exports = cdb.core.Model.extend({
  defaults: {
    search: false
  },

  toggleSearch: function () {
    this.set('search', !this.get('search'));
  },

  enableSearch: function () {
    this.set('search', true);
  },

  disableSearch: function () {
    this.set('search', false);
  },

  isSearchEnabled: function () {
    return this.get('search');
  }

});
