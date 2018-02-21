var CoreView = require('backbone/core-view');
var CodeMirrorView = require('builder/components/code-mirror/code-mirror-view');
var FactoryHints = require('builder/editor/editor-hints/factory-hints');
var CSSHints = require('builder/editor/editor-hints/css-hints');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'layerDefinitionModel',
  'styleModel',
  'codemirrorModel',
  'editorModel',
  'querySchemaModel',
  'onApplyEvent',
  'overlayModel'
];

module.exports = CoreView.extend({
  module: 'editor:style:style-cartocss-view',

  className: 'Editor-styleContentCartoCSS Editor-content',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();

    FactoryHints.init({
      querySchemaModel: this._querySchemaModel,
      layerDefinitionModel: this._layerDefinitionModel,
      tokens: CSSHints
    });
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._initViews();
    this._toggleOverlay();

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._layerDefinitionModel, 'change:cartocss', this._updateEditorContent);
    this.listenTo(this._overlayModel, 'change:visible', this._toggleOverlay);
  },

  _initViews: function () {
    var hints = FactoryHints.reset().hints;
    this.codeMirrorView = new CodeMirrorView({
      model: this._codemirrorModel,
      addons: ['color-picker'],
      hints: hints,
      tips: [
        _t('editor.style.code-mirror.save')
      ]
    });
    this.codeMirrorView.bind('codeSaved', this._triggerCodeSaved, this);
    this.addView(this.codeMirrorView);
    this.$el.append(this.codeMirrorView.render().el);
  },

  _toggleOverlay: function () {
    var isDisabled = this._overlayModel.get('visible');
    this.$el.toggleClass('is-disabled', isDisabled);
  },

  _updateEditorContent: function () {
    if (this._editorModel.get('edition') === false) {
      this.codeMirrorView.setContent(this._layerDefinitionModel.get('cartocss'));
    }
  },

  _triggerCodeSaved: function (code, view) {
    this._onApplyEvent && this._onApplyEvent();
  }
});
