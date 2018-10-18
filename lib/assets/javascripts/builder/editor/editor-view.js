var CoreView = require('backbone/core-view');
var Backbone = require('backbone');
var EditorPane = require('./editor-pane');
var ExportImagePane = require('./export-image-pane/export-image-pane');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var StackLayoutView = require('builder/components/stack-layout/stack-layout-view');

var REQUIRED_OPTS = [
  'userActions',
  'modals',
  'configModel',
  'userModel',
  'editorModel',
  'pollingModel',
  'analysisDefinitionNodesCollection',
  'layerDefinitionsCollection',
  'privacyCollection',
  'widgetDefinitionsCollection',
  'mapcapsCollection',
  'mapDefinitionModel',
  'visDefinitionModel',
  'mapStackLayoutModel',
  'stateDefinitionModel',
  'selectedTabItem',
  'settingsCollection',
  'routeModel'
];

module.exports = CoreView.extend({

  className: 'Editor-content',

  events: {
    'click .js-add': '_addItem'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();
    this._generateStackLayoutView();
    return this;
  },

  _generateStackLayoutView: function () {
    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return this._createEditorView(stackLayoutModel, opts).bind(this);
      }.bind(this)
    }]);

    stackViewCollection.push({
      createStackView: function (stackLayoutModel, opts) {
        return this._createExportImageView(stackLayoutModel, opts).bind(this);
      }.bind(this)
    });

    this._stackLayoutView = new StackLayoutView({
      className: 'Editor-content',
      collection: stackViewCollection
    });

    this.addView(this._stackLayoutView);
    this.$el.append(this._stackLayoutView.render().$el);
  },

  _createEditorView: function (stackLayoutModel, opts) {
    var view = new EditorPane({
      analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
      configModel: this._configModel,
      editorModel: this._editorModel,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      mapStackLayoutModel: this._mapStackLayoutModel,
      mapcapsCollection: this._mapcapsCollection,
      modals: this._modals,
      pollingModel: this._pollingModel,
      privacyCollection: this._privacyCollection,
      stateDefinitionModel: this._stateDefinitionModel,
      userActions: this._userActions,
      userModel: this._userModel,
      visDefinitionModel: this._visDefinitionModel,
      widgetDefinitionsCollection: this._widgetDefinitionsCollection,
      selectedTabItem: this._selectedTabItem,
      routeModel: this._routeModel
    });

    view.bind('export-image', function () {
      this._stackLayoutView.model.goToStep(1);
    }, this);

    return view;
  },

  _createExportImageView: function (stackLayoutModel, opts) {
    var view = new ExportImagePane({
      visDefinitionModel: this._visDefinitionModel,
      canvasClassName: 'CDB-Map',
      configModel: this._configModel,
      stackLayoutModel: stackLayoutModel,
      userModel: this._userModel,
      mapDefinitionModel: this._mapDefinitionModel,
      stateDefinitionModel: this._stateDefinitionModel,
      editorModel: this._editorModel,
      settingsCollection: this._settingsCollection
    });

    return view;
  }
});
