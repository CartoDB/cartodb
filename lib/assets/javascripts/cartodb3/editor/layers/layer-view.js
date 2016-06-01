var _ = require('underscore');
var cdb = require('cartodb.js');
var template = require('./layer.tpl');
var ContextMenuView = require('../../components/context-menu/context-menu-view');
var CustomListCollection = require('../../components/custom-list/custom-list-collection');

/**
 * View for an individual layer definition model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'Editor-ListLayer-item js-layer js-sortable',

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

    this._renderContextMenu();

    return this;
  },

  _onAddAnalysisClick: function () {
    this._openAddAnalysis(this.model);
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

  _renderContextMenu: function () {
    var menuItems = new CustomListCollection([
      {
        label: 'Delete layer…',
        val: 'delete-layer',
        destructive: true
      }
    ]);

    var triggerElementID = 'context-menu-trigger-' + this.model.cid;
    this.$('.js-show-menu').attr('id', triggerElementID);
    this._menuView = new ContextMenuView({
      collection: menuItems,
      triggerElementID: triggerElementID,
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
    cdb.core.View.prototype.clean.apply(this);
  }
});
