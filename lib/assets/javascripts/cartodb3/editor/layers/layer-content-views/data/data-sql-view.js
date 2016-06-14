var CoreView = require('backbone/core-view');
var CodeMirrorView = require('../../../../editor/components/code-mirror/code-mirror-view');
var ErrorTemplate = require('./code-mirror-error.tpl');

module.exports = CoreView.extend({

  className: 'Editor-dataContentSQL Editor-content',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.codemirrorModel) throw new Error('codemirrorModel is required');
    if (!opts.onApplyEvent) throw new Error('onApplyEvent');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._codemirrorModel = opts.codemirrorModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    this.codeMirrorView = new CodeMirrorView({
      model: this._codemirrorModel,
      tip: _t('editor.data.code-mirror.save'),
      errorTemplate: ErrorTemplate
    });

    this.codeMirrorView.bind('codeSaved', this._triggerCodeSaved, this);
    this.addView(this.codeMirrorView);
    this.$el.append(this.codeMirrorView.render().el);
  },

  _updateEditorContent: function () {
    this.codeMirrorView.setContent(this._layerDefinitionModel.get('sql'));
  },

  _triggerCodeSaved: function (code, view) {
    this.options.onApplyEvent && this.options.onApplyEvent();
  }

});
