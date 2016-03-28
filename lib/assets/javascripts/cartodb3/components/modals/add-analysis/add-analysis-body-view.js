var cdb = require('cartodb.js');
var DefaultOptionView = require('./default-add-analysis-option-view');
var createAnalysisOptionsModels = require('./create-analysis-options-models');

/**
 * Renders the body of add-analysis/add-layer modal, to select an analysis node to add.
 */
module.exports = cdb.core.View.extend({

  tagName: 'ul',

  render: function () {
    this.clearSubViews();
    this.collection.each(this._renderOption, this);

    return this;
  },

  _renderOption: function (m) {
    var view = new DefaultOptionView({
      model: m
    });
    this.addView(view);
    this.$el.append(view.render().el);
  }

});
