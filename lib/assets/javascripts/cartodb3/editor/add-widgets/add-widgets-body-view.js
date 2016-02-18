var cdb = require('cartodb.js');
var AddWidgetsFormulaOptionsView = require('./add-widgets-formula-options-view');

/**
 * View to select widget candidates to create.
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    // TODO filter out all unique columns etc.
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    console.log(this._layerDefinitionsCollection);
  },

  render: function () {
    this.clearSubViews();

    // TODO should be wrapped in a tabpane component here
    var view = new AddWidgetsFormulaOptionsView({
      columns: []
    });
    this.addView(view);
    this.$el.append(view.render().$el);

    return this;
  }

});
