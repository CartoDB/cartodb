var $ = require('jquery');
var cdb = require('cartodb.js');
var Backbone = require('backbone');

/**
 *  TabPaneContentView component
 */

module.exports = cdb.core.View.extend({

  className: 'TabPaneContent',

  initialize: function(options) {
    if (!this.model) {
      throw new Error('A TabPaneModel should be provided');
    }
  },

  render: function() {
    var view = this.model.get('createContentView')();
    this.addView(view);
    this.$el.append(view.render().$el);

    return this;
  }
});
