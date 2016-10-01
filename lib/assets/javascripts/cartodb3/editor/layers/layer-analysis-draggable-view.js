require('jquery-ui');
var CoreView = require('backbone/core-view');
var template = require('./layer-analysis-draggable.tpl');
var analyses = require('../../data/analyses');
var layerColors = require('../../data/layer-colors');

/**
 * Attach draggable behavior to an analysis node
 * Implemented as a view to hook into Backbone's lifecycle handling, but really it's just attaching the behavior to the
 * provided $nodeViewElement
 */
module.exports = CoreView.extend({
  options: {
    getNextLetter: function () { return 'x'; },
    sortableSelector: '',
    $nodeViewElement: null
  },

  initialize: function () {
    if (!this.options.sortableSelector) throw new Error('sortableSelector is required');
    if (!this.options.$nodeViewElement) throw new Error('$nodeViewElement is required');

    this.options.$nodeViewElement.draggable({
      appendTo: this.options.sortableSelector,
      connectToSortable: this.options.sortableSelector,
      cursor: 'move',
      axis: 'y',
      cursorAt: { top: 40 },
      helper: this._createHelper.bind(this)
    });
  },

  _createHelper: function () {
    var nextLetter = this.options.getNextLetter();
    return template({
      nodeId: this.model.id,
      nextLetter: nextLetter,
      nextBgColor: layerColors.getColorForLetter(nextLetter),
      title: analyses.title(this.model)
    });
  },

  clean: function () {
    if (this.options.$nodeViewElement && this.options.$nodeViewElement.data('ui-draggable')) {
      this.options.$nodeViewElement.draggable('destroy');
    }

    this.options.$nodeViewElement = null; // remove DOM reference to avoid memory leak
    CoreView.prototype.clean.apply(this, arguments);
  }

});
