var cdb = require('cartodb-deep-insights.js');
var LayerAnalysisDraggableHelperView = require('../layer-analysis-draggable-helper-view');

/**
 *  Base layer analysis view.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'js-analysis',

  _onClick: function (e) {
    this.trigger('nodeClicked', this.model.id, this);
  },

  _addDraggableHelper: function () {
    this.draggableHelperView = new LayerAnalysisDraggableHelperView({
      el: this.el
    });

    this.addView(this.draggableHelperView);
    this.draggableHelperView.bind('dropped', this._onDropped, this);
    this.draggableHelperView.bind('click', this._onClick, this);
  },

  _onDropped: function () {
    console.log('TODO: creates a new layer from ' + this.model.toJSON()); // TODO: replace with actual layer generation
  }

});
