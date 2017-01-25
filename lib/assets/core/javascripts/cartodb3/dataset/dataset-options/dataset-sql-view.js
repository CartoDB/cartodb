var CoreView = require('backbone/core-view');
var CodeMirrorView = require('../../components/code-mirror/code-mirror-view');
var ErrorTemplate = require('./code-mirror-error.tpl');
var FactoryHints = require('../../editor/editor-hints/factory-hints');
var SQLHints = require('../../editor/editor-hints/sql-hints');

module.exports = CoreView.extend({

  className: 'Editor-content Dataset-editor',

  initialize: function (opts) {
    if (!opts.codemirrorModel) throw new Error('codemirrorModel is required');
    if (!opts.onApplyEvent) throw new Error('onApplyEvent');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._codemirrorModel = opts.codemirrorModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;

    FactoryHints.init({
      querySchemaModel: this._querySchemaModel,
      layerDefinitionModel: this._layerDefinitionModel,
      tokens: SQLHints
    });
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var hints = FactoryHints.reset().hints;
    this.codeMirrorView = new CodeMirrorView({
      className: 'Dataset-codemirror',
      model: this._codemirrorModel,
      hints: hints,
      mode: 'text/x-pgsql',
      tip: _t('editor.data.code-mirror.tip'),
      errorTemplate: ErrorTemplate
    });

    this.codeMirrorView.bind('codeSaved', this._triggerCodeSaved, this);
    this.addView(this.codeMirrorView);
    this.$el.append(this.codeMirrorView.render().el);
  },

  _triggerCodeSaved: function (code, view) {
    this.options.onApplyEvent && this.options.onApplyEvent();
  }

});
