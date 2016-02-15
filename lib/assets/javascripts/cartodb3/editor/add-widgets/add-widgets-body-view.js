var cdb = require('cartodb.js');
var AddWidgetsFormulaOptionsView = require('./add-widgets-formula-options-view');

/**
 * View to add new widgets.
 * Expected to be rendered in a modal
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.collection) throw new Error('collection is required');
  },

  render: function () {
    // TODO should be wrapped in a tabpane component here
    var view = new AddWidgetsFormulaOptionsView({
      collection: this.collection
    });
    this.addView(view);
    this.$el.append(view.render().$el);

    return this;
  }
});
