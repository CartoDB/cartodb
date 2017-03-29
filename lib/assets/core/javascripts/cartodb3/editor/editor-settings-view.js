var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var EditorSettingsPane = require('./editor-settings-pane');
var ExportImagePane = require('./export-image-pane/export-image-pane');
var StackLayoutView = require('../components/stack-layout/stack-layout-view');

var checkAndBuildOpts = require('../helpers/required-opts');
var REQUIRED_OPTS = [
  'configModel',
  'editorModel',
  'mapcapsCollection',
  'mapDefinitionModel',
  'modals',
  'overlaysCollection',
  'privacyCollection',
  'settingsCollection',
  'visDefinitionModel',
  'userModel'
];

module.exports = CoreView.extend({
  className: 'Editor-panel',
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._editorModel.set('edition', false);
  },

  render: function () {
    this.clearSubViews();
    this._generateStackLayoutView();
    return this;
  },

  _generateStackLayoutView: function () {
    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return this._createEditorSettingsView(stackLayoutModel, opts).bind(this);
      }.bind(this)
    }]);

    if (this._userModel.featureEnabled('static-maps')) {
      stackViewCollection.push({
        createStackView: function (stackLayoutModel, opts) {
          return this._createExportImageView(stackLayoutModel, opts).bind(this);
        }.bind(this)
      });
    }

    this._stackLayoutView = new StackLayoutView({ collection: stackViewCollection });
    this.addView(this._stackLayoutView);
    this.$el.append(this._stackLayoutView.render().$el);
  },

  _createEditorSettingsView: function (stackLayoutModel, opts) {
    var view = new EditorSettingsPane({
      configModel: this._configModel,
      editorModel: this._editorModel,
      mapcapsCollection: this._mapcapsCollection,
      mapDefinitionModel: this._mapDefinitionModel,
      modals: this._modals,
      overlaysCollection: this._overlaysCollection,
      privacyCollection: this._privacyCollection,
      settingsCollection: this._settingsCollection,
      userModel: this._userModel,
      visDefinitionModel: this._visDefinitionModel
    });

    view.bind('export-image', function () {
      this._stackLayoutView.model.goToStep(1);
    }, this);

    return view;
  },

  _createExportImageView: function (stackLayoutModel, opts) {
    var view = new ExportImagePane({
      canvasClassName: 'CDB-Map',
      configModel: this._configModel,
      stackLayoutModel: stackLayoutModel,
      userModel: this._userModel
    });

    return view;
  }
});
