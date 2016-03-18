var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var template = require('./layer.tpl');
require('jquery-ui/draggable');
require('jquery-ui/droppable');

var DEFAULT_REVERT_DURATION = 200;
var DEFAULT_DRAGGABLE_SCOPE = 'layer';

/**
 * View for an individual layer definition model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'Editor-ListLayer-item js-layer',

  events: {
    'click .js-remove': '_onRemove',
    'click .js-title': '_onEdit'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!_.isFunction(opts.newAnalysisViews)) throw new Error('newAnalysisViews is required as a function');

    this._stackLayoutModel = opts.stackLayoutModel;
    this._newAnalysisViews = opts.newAnalysisViews;

    this.listenTo(this.model, 'change', this.render);
    this.listenToOnce(this.model, 'destroy', this._onDestroy);
  },

  render: function () {
    this.clearSubViews();

    var m = this.model;

    this.$el.html(template({
      title: m.getName(),
      letter: m.get('letter')
    }));

    if (m.get('source')) {
      var view = this._newAnalysisViews(this.$('.js-analyses'), m);
      this.addView(view);
      view.render();
    }

    this._initDraggable();
    this._initDroppable();

    return this;
  },

  _initDraggable: function () {
    this.$el.draggable({
      revert: true,
      revertDuration: this.options.revert_duration || DEFAULT_REVERT_DURATION,
      scope: DEFAULT_DRAGGABLE_SCOPE,
      start: this._onStartDragging.bind(this)
    });
  },

  _initDroppable: function () {
    this.$el.droppable({
      scope: DEFAULT_DRAGGABLE_SCOPE,
      hoverClass: 'is-active',
      accept: '.js-layer',
      drop: this._onDrop.bind(this)
    });
  },

  _onDrop: function (e, ui) {
    var draggedLayerLetter = ui.helper.data('dragged_layer_letter');

    // TODO: replace with the creation of a new analysis
    console.log(draggedLayerLetter, this.model.get('letter'));
  },

  _onStartDragging: function (e, ui) {
    this._preventEditClick = true;
    ui.helper.data('dragged_layer_letter', this.model.get('letter'));
  },

  _onRemove: function (ev) {
    this.killEvent(ev); // to avoid the general click to trigger (i.e. do not try to edit on removal)
    this.model.destroy();
  },

  _onEdit: function (e) {
    e.stopPropagation();

    if (this._preventEditClick) {
      this._preventEditClick = false;
      return;
    }
    this._stackLayoutModel.nextStep(this.model, 'layers');
  },

  _onDestroy: function () {
    this.clean();
  },

  _destroyDraggable: function () {
    if (this.$el.data('ui-draggable')) {
      this.$el.draggable('destroy');
    }
  },

  _destroyDroppable: function () {
    if (this.$el.data('ui-droppable')) {
      this.$el.droppable('destroy');
    }
  },

  clean: function () {
    this._destroyDraggable();
    this._destroyDroppable();
    cdb.core.View.prototype.clean.apply(this);
  }
});
