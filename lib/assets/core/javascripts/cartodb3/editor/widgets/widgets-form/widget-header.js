var CoreView = require('backbone/core-view');
var template = require('./widget-header.tpl');
var InlineEditorView = require('../../../components/inline-editor/inline-editor-view');
var templateInlineEditor = require('./inline-editor.tpl');
var ContextMenuFactory = require('../../../components/context-menu-factory-view');
var WidgetsService = require('../widgets-service');

module.exports = CoreView.extend({
  events: {
    'click .js-toggle-menu': '_onToggleContextMenuClicked'
  },

  initialize: function (opts) {
    if (!this.model) throw new Error('model is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._userActions = opts.userActions;
    this._stackLayoutModel = opts.stackLayoutModel;
  },

  render: function () {
    var widgetTitle = this.model.get('title');

    this.$el.html(
      template({
        title: widgetTitle,
        source: this.model.get('source'),
        sourceColor: this._layerDefinitionModel.get('color'),
        layerName: this._layerDefinitionModel.getName()
      })
    );

    this._initViews();
    return this;
  },

  _initViews: function () {
    var widgetTitle = this.model.get('title');

    this._inlineEditor = new InlineEditorView({
      template: templateInlineEditor,
      renderOptions: {
        title: widgetTitle
      },
      onEdit: this._renameWidget.bind(this)
    });

    this.$('.js-header').append(this._inlineEditor.render().el);
    this.addView(this._inlineEditor);

    var menuItems = [{
      label: _t('editor.widgets.options.rename'),
      val: 'rename-widget',
      action: this._onRenameWidget.bind(this)
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
      this.model.set({title: newName});
      this._userActions.saveWidget(this.model);
      this.$('.js-title').text(newName).show();
      this._inlineEditor.hide();
    }
  },

  _confirmDeleteWidget: function () {
    WidgetsService.removeWidget(this.model);
  },

  _onDeleteWidget: function (modal) {
    modal.destroy();
    this._stackLayoutModel.prevStep('widgets');
    this.model.destroy();
  }
});
