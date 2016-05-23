var _ = require('underscore');
var cdb = require('cartodb.js');
var nodeIds = require('../../data/analysis-definition-node-ids');
var template = require('./layer.tpl');
require('jquery-ui/draggable');
require('jquery-ui/droppable');
var ContextMenuView = require('../../components/context-menu/context-menu-view');
var CustomListCollection = require('../../components/custom-list/custom-list-collection');

var DEFAULT_REVERT_DURATION = 200;
var DEFAULT_DRAGGABLE_SCOPE = 'layer';

/**
 * View for an individual layer definition model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'Editor-ListLayer-item js-layer',

  events: {
    'click .js-add-analysis': '_onAddAnalysisClick',
    'click .js-show-menu': '_onOpenContextMenu',
    'click .js-title': '_onEditLayer'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!_.isFunction(opts.newAnalysesView)) throw new Error('newAnalysesView is required as a function');
    if (!_.isFunction(opts.openAddAnalysis)) throw new Error('openAddAnalysis is required as a function');

    this._stackLayoutModel = opts.stackLayoutModel;
    this._newAnalysesView = opts.newAnalysesView;
    this._openAddAnalysis = opts.openAddAnalysis;

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
      var view = this._newAnalysesView(this.$('.js-analyses'), m);
      view.bind('nodeClicked', this._onEditAnalysis, this);
      this.addView(view);
      view.render();
    }

    this._initDraggable();
    this._initDroppable();

    this._renderContextMenu();

    return this;
  },

  _onAddAnalysisClick: function () {
    this._openAddAnalysis(this.model);
  },

  _initDraggable: function () {
    this.$el.draggable({
      revert: true,
      revertDuration: this.options.revert_duration || DEFAULT_REVERT_DURATION,
      scope: DEFAULT_DRAGGABLE_SCOPE,
      start: this._onStartDragging.bind(this),
      stop: this._onStopDragging.bind(this)
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
    var draggedLayerSource = ui.helper.data('dragged_layer_source');
    var droppedLayerSource = this.model.get('source');

    // TODO: temporary code to test the creation of an analysis
    this.model.createNewAnalysisNode({
      id: nodeIds.next(droppedLayerSource),
      type: 'point-in-polygon',
      points_source: droppedLayerSource,
      polygons_source: draggedLayerSource
    });
  },

  _onStartDragging: function (e, ui) {
    this._preventEditClick = true;
    ui.helper.data('dragged_layer_source', this.model.get('source'));
  },

  _onStopDragging: function () {
    this._preventEditClick = false;
  },

  _onEditLayer: function (e) {
    e.stopPropagation();

    if (this._preventEditClick) {
      this._preventEditClick = false;
      return;
    }
    this._stackLayoutModel.nextStep(this.model, 'layers');
  },

  _onEditAnalysis: function (selectedNode) {
    this._stackLayoutModel.nextStep(this.model, 'layers', selectedNode);
  },

  _onOpenContextMenu: function () {
    this._menuView.toggle();
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

  _renderContextMenu: function () {
    var menuItems = new CustomListCollection([
      {
        label: 'Delete layer…',
        val: 'delete-layer',
        destructive: true
      }
    ]);

    this._menuView = new ContextMenuView({
      collection: menuItems,
      targetElement: this.$('.js-show-menu').get(0),
      offset: { top: '47px', right: '12px' }
    });

    menuItems.bind('change:selected', function (menuItem) {
      if (menuItem.get('val') === 'delete-layer') {
        this.model.destroy();
      }
    }, this);

    this.$el.append(this._menuView.render().el);
    this.addView(this._menuView);
  },

  clean: function () {
    this._destroyDraggable();
    this._destroyDroppable();
    cdb.core.View.prototype.clean.apply(this);
  }
});
