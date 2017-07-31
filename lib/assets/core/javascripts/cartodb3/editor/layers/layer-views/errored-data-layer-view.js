var $ = require('jquery');
var DataLayerView = require('./data-layer-view');
var template = require('./data-layer.tpl');
var checkAndBuildOpts = require('../../../helpers/required-opts');
var brokenLayerTemplate = require('./broken-layer.tpl');
var ContextMenuView = require('../../../components/context-menu/context-menu-view');
var CustomListCollection = require('../../../components/custom-list/custom-list-collection');
var TipsyTooltipView = require('../../../components/tipsy-tooltip-view');
var defaultLayerAnalysisView = require('../analysis-views/default-layer-analysis-view.tpl');
var BROKEN_NODE_LAYER_COLOR = '#CCC';

var REQUIRED_OPTS = [
  'userActions',
  'stackLayoutModel',
  'layerDefinitionsCollection',
  'modals',
  'configModel',
  'stateDefinitionModel',
  'widgetDefinitionsCollection',
  'visDefinitionModel',
  'analysisDefinitionNodesCollection'
];

module.exports = DataLayerView.extend({

  tagName: 'li',
  className: 'Editor-ListLayer-item',

  events: {
    'click .js-toggle-menu': '_onToggleContextMenuClicked'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();

    var m = this.model;
    var isTorque = m.isTorqueLayer();
    var isAnimation = this.model.styleModel.isAnimation();

    this.$el.html(template({
      layerId: m.id,
      title: m.getName(),
      color: BROKEN_NODE_LAYER_COLOR,
      isVisible: true,
      isAnimated: isAnimation,
      isTorque: isTorque,
      hasError: false,
      isCollapsed: false,
      numberOfAnalyses: m.getNumberOfAnalyses(),
      numberOfWidgets: this._widgetDefinitionsCollection.widgetsOwnedByLayer(m.id),
      hasGeom: false
    }));

    this.$('.js-thumbnail').append(
      brokenLayerTemplate({
        letter: m.get('letter')
      })
    );

    // Displaying errored node
    var $nodeAnalysisItem = $('<li>').addClass('Editor-ListAnalysis-item Editor-ListAnalysis-layer');
    $nodeAnalysisItem.append(
      defaultLayerAnalysisView({
        title: 'Node',
        id: this.model.get('source'),
        bgColor: BROKEN_NODE_LAYER_COLOR,
        isDone: true,
        hasError: false
      })
    );
    this.$('.js-analyses').append($nodeAnalysisItem);

    this.$el.addClass('is-errored');
    this.$el.removeClass('js-sortable-item');
    this.$el.toggleClass('is-animated', isTorque);

    var errorTooltip = new TipsyTooltipView({
      el: this.$('.js-warningIcon'),
      gravity: 's',
      offset: 0,
      title: function () {
        return _t('editor.layers.errors.non-existent-node', { nodeId: this.model.get('source') });
      }.bind(this)
    });
    this.addView(errorTooltip);

    return this;
  },

  _showContextMenu: function (position) {
    var menuItems = new CustomListCollection();

    if (this.model.canBeDeletedByUser()) {
      menuItems.add({
        label: _t('editor.layers.options.delete-and-reload'),
        val: 'delete-layer',
        destructive: true
      });
    }

    var triggerElementID = 'context-menu-trigger-' + this.model.cid;
    this.$('.js-toggle-menu').attr('id', triggerElementID);
    this._menuView = new ContextMenuView({
      collection: menuItems,
      triggerElementID: triggerElementID,
      position: position
    });

    menuItems.bind('change:selected', function (menuItem) {
      var selectedItem = menuItem.get('val');
      if (selectedItem === 'delete-layer') {
        this.listenTo(this.model, 'destroy', function () {
          window.location.reload();
        });

        this._confirmDeleteLayer();
      }
    }, this);

    this._menuView.model.bind('change:visible', function (model, isContextMenuVisible) {
      if (this._hasContextMenu() && !isContextMenuVisible) {
        this._hideContextMenu();
      }
    }, this);

    this._menuView.show();
    this.addView(this._menuView);
  }

});
