var CoreView = require('backbone/core-view');
var template = require('./widget-view.tpl');
var ContextMenuFactory = require('builder/components/context-menu-factory-view');
var InlineEditorView = require('builder/components/inline-editor/inline-editor-view');
var templateInlineEditor = require('./inline-editor.tpl');
var WidgetsService = require('./widgets-service');
var Analyses = require('builder/data/analyses');
var Router = require('builder/routes/router');

var widgetIconTemplateMap = {
  category: require('./widget-icon-layer-category.tpl'),
  histogram: require('./widget-icon-layer-histogram.tpl'),
  formula: require('./widget-icon-layer-formula.tpl'),
  'time-series': require('./widget-icon-layer-timeSeries.tpl')
};

/**
 * View for an individual widget definition model.
 */
module.exports = CoreView.extend({
  module: 'editor:widgets:widget-view',

  tagName: 'li',

  className: 'BlockList-item js-widgetItem',

  events: {
    'click': '_onEditWidget'
  },

  initialize: function (opts) {
    if (!opts.layer) throw new Error('layer is required');
    if (!opts.userActions) throw new Error('userActions is required');

    this.layer = opts.layer;
    this._userActions = opts.userActions;
    this.stackLayoutModel = opts.stackLayoutModel;

    this.listenTo(this.model, 'change', this.render);
    this.listenToOnce(this.model, 'destroy', this._onDestroy);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var widgetType = this.model.get('type');
    var source = this.model.get('source');
    var analysisNode = this.layer.findAnalysisDefinitionNodeModel(source);
    var layerName = analysisNode.isSourceType()
      ? this.layer.getTableName()
      : this.layer.getName();

    this.$el.html(template({
      widgetType: widgetType,
      layerName: layerName,
      sourceId: source,
      sourceColor: analysisNode.getColor(),
      sourceType: Analyses.short_title(analysisNode.get('type')),
      isSourceType: analysisNode.isSourceType()
    }));
    this.$el.attr('data-model-cid', this.model.cid);

    this._initViews();

    return this;
  },

  _initViews: function () {
    var widgetType = this.model.get('type');

    this._inlineEditor = new InlineEditorView({
      template: templateInlineEditor,
      renderOptions: {
        title: this.model.get('title')
      },
      onClick: this._onEditWidget.bind(this),
      onEdit: this._renameWidget.bind(this)
    });

    this.$('.js-header').append(this._inlineEditor.render().el);
    this.addView(this._inlineEditor);

    var iconTemplate = widgetIconTemplateMap[widgetType];

    if (!iconTemplate) {
      console.log(widgetType + ' widget template not defined');
    } else {
      this.$('.js-widgetIcon').append(iconTemplate());
    }

    var menuItems = [{
      label: _t('editor.widgets.options.rename'),
      val: 'rename-widget',
      action: this._onRenameWidget.bind(this)
    }, {
      label: _t('editor.widgets.options.edit'),
      val: 'edit-widget',
      action: this._onEditWidget.bind(this)
    }, {
      label: _t('editor.widgets.options.remove'),
      val: 'delete-widget',
      destructive: true,
      action: this._confirmDeleteWidget.bind(this)
    }];

    this._contextMenuFactory = new ContextMenuFactory({
      menuItems: menuItems
    });

    this.$('.js-context-menu').append(this._contextMenuFactory.render().el);
    this.addView(this._contextMenuFactory);
  },

  _onRenameWidget: function () {
    this._inlineEditor.edit();
  },

  _renameWidget: function () {
    var newName = this._inlineEditor.getValue();

    if (newName !== '' && newName !== this.model.get('title')) {
      this.$('.js-title').text(newName).show();
      this._inlineEditor.hide();
      this.model.set({title: newName});
      this._userActions.saveWidget(this.model);
    }
  },

  _confirmDeleteWidget: function () {
    WidgetsService.removeWidget(this.model);
  },

  _onEditWidget: function (event) {
    event && event.stopPropagation();
    WidgetsService.editWidget(this.model);
  },

  _onDestroy: function () {
    Router.goToWidgetList();
    this.clean();
  }
});
