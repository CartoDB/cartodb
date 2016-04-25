var cdb = require('cartodb.js');
var template = require('./custom-list-search.tpl');

/*
 *  Search view component
 *
 */

module.exports = cdb.core.View.extend({

  className: 'CustomList-form',
  tagName: 'form',

  events: {
    'keyup .js-search': '_onSearchType',
    'submit': 'killEvent'
  },

  render: function () {
    this.$el
      .empty()
      .append(
        template({
          typeLabel: this.options.typeLabel
        })
      );
    return this;
  },

  _onSearchType: function (e) {
    var query = this.$('.js-search').val();
    this.model.set('query', query);
  }

});
