var cdb = require('cartodb.js');
var AddWidgetsFormulaOptionsView = require('./add-widgets-formula-options-view');

/**
 * View to select widget candidates to create.
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
  },

  render: function () {
    // TODO should be wrapped in a tabpane component here
    var view = new AddWidgetsFormulaOptionsView({
      layerDefinitionsCollection: this._layerDefinitionsCollection
    });
    this.addView(view);
    this.$el.append(view.render().$el);

    return this;
  }
});
