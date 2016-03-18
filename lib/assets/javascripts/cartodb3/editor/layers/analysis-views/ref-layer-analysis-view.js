var template = require('./ref-layer-analysis-view.tpl');
var LayerAnalysisDraggableHelperView = require('../layer-analysis-draggable-helper-view');

/**
 * Reference to another layer.
 * this.model is a layer-definition-model
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'js-analysis',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(template({
      letter: this.model.get('letter'),
      title: this.model.getName()
    }));

    this.draggableHelperView = new LayerAnalysisDraggableHelperView({
      el: this.el
    });

    this.addView(this.draggableHelperView);
    this.draggableHelperView.bind('dropped', this._onDropped, this);

    return this;
  },

  _onDropped: function () {
    console.log(this.model.toJSON()); // TODO: replace with actual layer generation
  }

});
