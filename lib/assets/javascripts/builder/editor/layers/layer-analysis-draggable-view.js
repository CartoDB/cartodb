require('jquery-ui');
var CoreView = require('backbone/core-view');
var template = require('./layer-analysis-draggable.tpl');
var analyses = require('builder/data/analyses');
var layerColors = require('builder/data/layer-colors');

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

  initialize: function (opts) {
    if (!opts.sortableSelector) throw new Error('sortableSelector is required');
    if (!opts.$nodeViewElement) throw new Error('$nodeViewElement is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

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
    var layerLetter = this.options.layerDefinitionModel.get('letter');
    return template({
      nodeId: this.model.id,
      nextLetter: nextLetter,
      layerLetter: layerLetter,
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
