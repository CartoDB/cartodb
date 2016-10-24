var CoreView = require('backbone/core-view');
var template = require('./widget-view.tpl');
var ContextMenuFactory = require('../../components/context-menu-factory-view');
var InlineEditorView = require('../../components/inline-editor/inline-editor-view');
var templateInlineEditor = require('./inline-editor.tpl');
var WidgetsService = require('./widgets-service');

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

  tagName: 'li',

  className: 'BlockList-item js-widgetItem',

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
    var widgetType = this.model.get('type');
    var source = this.model.get('source');
    var sourceColor = this.layer.get('color');

    this.$el.html(template({
      widgetType: widgetType,
      layerName: this.layer.getName(),
      source: source,
      sourceColor: sourceColor
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

  _onEditWidget: function () {
    this.stackLayoutModel.nextStep(this.model, 'widget-content');
  },

  _onDestroy: function () {
    this.clean();
  }
});
