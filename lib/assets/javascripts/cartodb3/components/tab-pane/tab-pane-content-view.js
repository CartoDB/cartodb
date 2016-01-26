var $ = require('jquery');
var cdb = require('cartodb-deep-insights.js');
var Backbone = require('backbone');

/**
 *  TabPaneContentView component
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
    if (!this.model) {
      throw new Error('A model should be provided');
    }
  },

  render: function() {
    var view = this.model.get('createContentView')();
    this.addView(view);
    this.$el.append(view.render().$el);

    return this;
  }
});
