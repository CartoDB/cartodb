var CoreView = require('backbone/core-view');
var CodeMirrorView = require('../../components/code-mirror/code-mirror-view');
var FactoryHints = require('../editor-hints/factory-hints');
var CSSHints = require('../editor-hints/css-hints');

module.exports = CoreView.extend({

  className: 'Editor-styleContentCartoCSS Editor-content',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.styleModel) throw new Error('styleModel is required');
    if (!opts.codemirrorModel) throw new Error('codemirrorModel is required');
    if (!opts.editorModel) throw new Error('editorModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.onApplyEvent) throw new Error('onApplyEvent');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._styleModel = this._layerDefinitionModel.styleModel;
    this._codemirrorModel = opts.codemirrorModel;
    this._editorModel = opts.editorModel;
    this._querySchemaModel = opts.querySchemaModel;

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
    return this;
  },

  _initBinds: function () {
    this._layerDefinitionModel.bind('change:cartocss', this._updateEditorContent, this);
    this.add_related_model(this._layerDefinitionModel);
  },

  _initViews: function () {
    var hints = FactoryHints.reset().hints;
    this.codeMirrorView = new CodeMirrorView({
      model: this._codemirrorModel,
      hints: hints,
      tip: _t('editor.style.code-mirror.save')
    });
    this.codeMirrorView.bind('codeSaved', this._triggerCodeSaved, this);
    this.addView(this.codeMirrorView);
    this.$el.append(this.codeMirrorView.render().el);
  },

  _updateEditorContent: function () {
    if (this._editorModel.get('edition') === false) {
      this.codeMirrorView.setContent(this._layerDefinitionModel.get('cartocss'));
    }
  },

  _triggerCodeSaved: function (code, view) {
    this.options.onApplyEvent && this.options.onApplyEvent();
  }

});
