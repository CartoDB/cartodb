var CoreView = require('backbone/core-view');
var Backbone = require('backbone');
var EditorPane = require('./editor-pane');
var ExportImagePane = require('./export-image-pane/export-image-pane');
var checkAndBuildOpts = require('../helpers/required-opts');
var StackLayoutView = require('../components/stack-layout/stack-layout-view');

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
  'visDefinitionModel',
  'mapStackLayoutModel',
  'stateDefinitionModel',
  'selectedTabItem'
];

module.exports = CoreView.extend({

  className: 'Editor-content',

  events: {
    'click .js-add': '_addItem'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._generateStackLayoutView();
    return this;
  },

  _generateStackLayoutView: function () {
    var self = this;

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return self._createEditorView(stackLayoutModel, opts).bind(self);
      }
    }]);

    if (this._userModel.featureEnabled('static-maps')) {
      stackViewCollection.push({
        createStackView: function (stackLayoutModel, opts) {
          return self._createExportImageView(stackLayoutModel, opts).bind(self);
        }
      });
    }

    this._stackLayoutView = new StackLayoutView({ collection: stackViewCollection });
    this.addView(this._stackLayoutView);
    this.$el.append(this._stackLayoutView.render().$el);
  },

  _createEditorView: function (stackLayoutModel, opts) {
    var view = new EditorPane({
      stackLayoutModel: stackLayoutModel,
      userActions: this._userActions,
      modals: this._modals,
      configModel: this._configModel,
      userModel: this._userModel,
      editorModel: this._editorModel,
      pollingModel: this._pollingModel,
      analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      privacyCollection: this._privacyCollection,
      widgetDefinitionsCollection: this._widgetDefinitionsCollection,
      mapcapsCollection: this._mapcapsCollection,
      visDefinitionModel: this._visDefinitionModel,
      mapStackLayoutModel: this._mapStackLayoutModel,
      stateDefinitionModel: this._stateDefinitionModel
    });

    view.bind('export-image', this._exportImage, this);

    return view;
  },

  _createExportImageView: function (stackLayoutModel, opts) {
    var view = new ExportImagePane({
      canvasClassName: 'CDB-Map',
      stackLayoutModel: stackLayoutModel,
      modals: this._modals,
      configModel: this._configModel,
      userModel: this._userModel,
      editorModel: this._editorModel,
      privacyCollection: this._privacyCollection,
      widgetDefinitionsCollection: this._widgetDefinitionsCollection,
      mapcapsCollection: this._mapcapsCollection,
      visDefinitionModel: this._visDefinitionModel,
      mapStackLayoutModel: this._mapStackLayoutModel,
      stateDefinitionModel: this._stateDefinitionModel
    });

    view.bind('export-image', this._exportImage, this);

    return view;
  },

  _exportImage: function () {
    this._stackLayoutView.model.goToStep(1);
  }
});
