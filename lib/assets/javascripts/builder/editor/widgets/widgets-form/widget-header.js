var CoreView = require('backbone/core-view');
var template = require('./widget-header.tpl');
var InlineEditorView = require('builder/components/inline-editor/inline-editor-view');
var VisTableModel = require('builder/data/visualization-table-model');
var templateInlineEditor = require('./inline-editor.tpl');
var ContextMenuFactory = require('builder/components/context-menu-factory-view');
var WidgetsService = require('builder/editor/widgets/widgets-service');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var analyses = require('builder/data/analyses');

var REQUIRED_OPTS = [
  'layerDefinitionModel',
  'userActions',
  'stackLayoutModel',
  'configModel'
];

module.exports = CoreView.extend({
  events: {
    'click .js-toggle-menu': '_onToggleContextMenuClicked'
  },

  initialize: function (opts) {
    if (!this.model) throw new Error('model is required');
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._sourceNode = this._getSourceNode();

    if (this._sourceNode) {
      var tableName = this._sourceNode.get('table_name');
      this._visTableModel = new VisTableModel({
        id: tableName,
        table: {
          name: tableName
        }
      }, {
        configModel: this._configModel
      });
    }
  },

  render: function () {
    var widgetTitle = this.model.get('title');
    var source = this.model.get('source');
    var analysisNode = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(source);
    var layerName = analysisNode.isSourceType()
      ? this._layerDefinitionModel.getTableName()
      : this._layerDefinitionModel.getName();

    this.$el.html(
      template({
        title: widgetTitle,
        source: source,
        color: this._layerDefinitionModel.get('color'),
        layerName: layerName,
        nodeTitle: analyses.short_title(analysisNode),
        isSourceType: analysisNode.isSourceType(),
        url: this._visTableModel ? this._visTableModel.datasetURL() : ''
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

  _getSourceNode: function () {
    var nodeModel = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();

    var source;
    if (nodeModel.get('type') === 'source') {
      source = nodeModel;
    } else {
      var primarySource = nodeModel.getPrimarySource();
      if (primarySource && primarySource.get('type') === 'source') {
        source = primarySource;
      }
    }

    return source;
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
  }
});
