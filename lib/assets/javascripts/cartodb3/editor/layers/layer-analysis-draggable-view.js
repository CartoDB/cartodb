var _ = require('underscore');
require('jquery-ui/draggable');
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
    sortableSelector: '',
    $nodeViewElement: null
  },

  initialize: function () {
    if (!this.options.sortableSelector) throw new Error('sortableSelector is required');
    if (!this.options.$nodeViewElement) throw new Error('$nodeViewElement is required');

    // _.bindAll(this, '_onStartDragging', '_onDraggableStop', '_createHelper');
    _.bindAll(this, '_createHelper');

    this.options.$nodeViewElement.draggable({
      appendTo: this.options.sortableSelector,
      connectToSortable: this.options.sortableSelector,
      opacity: 0.9,
      cursor: 'move',
      cursorAt: { top: -5, left: -5 },
      axis: 'y',
      // scope: 'analysis',
      // revert: true,
      // revertDuration: 100, // ms
      // start: this._onStartDragging,
      // stop: this._onDraggableStop,
      helper: this._createHelper
    });
  },

  _createHelper: function () {
    return template({
      nodeId: this.model.id,
      title: AnalysisName(this.model.get('type'))
    });
  },

  // _onStartDragging: function (e, ui) {},
  //
  // _onDraggableStop: function (e, ui) {
  //   if (!ui.helper.data('dropped')) return;
  // },
  //
  clean: function () {
    if (this.options.$nodeViewElement && this.options.$nodeViewElement.data('ui-draggable')) {
      this.options.$nodeViewElement.draggable('destroy');
    }

    this.options.$nodeViewElement = null; // remove DOM reference to avoid memory leak
    CoreView.prototype.clean.apply(this, arguments);
  }

});
