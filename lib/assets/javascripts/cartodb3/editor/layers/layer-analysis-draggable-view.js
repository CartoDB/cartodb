require('jquery-ui');
var CoreView = require('backbone/core-view');
var AnalysisName = require('./analysis-name-map');
var template = require('./layer-analysis-draggable.tpl');

/**
 * Attach draggable behavior to an analysis node
 * Implemented as a view to hook into Backbone's lifecycle handling, but really it's just attaching the behavior to the
 * provided $nodeViewElement
 */
module.exports = CoreView.extend({

  options: {
    bgColor: '#E27D61',
    sortableSelector: '',
    $nodeViewElement: null
  },

  initialize: function () {
    if (!this.options.sortableSelector) throw new Error('sortableSelector is required');
    if (!this.options.$nodeViewElement) throw new Error('$nodeViewElement is required');

    this.options.$nodeViewElement.draggable({
      appendTo: this.options.sortableSelector,
      connectToSortable: this.options.sortableSelector,
      opacity: 0.80,
      cursor: 'move',
      cursorAt: { top: 40 },
      axis: 'y',
      helper: this._createHelper.bind(this)
    });
  },

  _createHelper: function () {
    return template({
      nodeId: this.model.id,
      bgColor: this.options.bgColor,
      title: AnalysisName(this.model.get('type'))
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
