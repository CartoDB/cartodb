var CoreView = require('backbone/core-view');
var CodeMirrorView = require('../../../../components/code-mirror/code-mirror-view');
var ErrorTemplate = require('./code-mirror-error.tpl');
var FactoryHints = require('../../../editor-hints/factory-hints');
var SQLHints = require('../../../editor-hints/sql-hints');

module.exports = CoreView.extend({

  className: 'Editor-dataContentSQL Editor-content',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.codemirrorModel) throw new Error('codemirrorModel is required');
    if (!opts.onApplyEvent) throw new Error('onApplyEvent');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._codemirrorModel = opts.codemirrorModel;

    this._initBinds();

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

  _initBinds: function () {
    this._querySchemaModel.on('change:query', this._onQueryChanged, this);
    this.add_related_model(this._querySchemaModel);
  },

  _onQueryChanged: function (mdl, status) {
    if (status === 'fetched') {
      this.codeMirrorView.updateHints(SQLHints.reset().hints);
    }
  },

  _initViews: function () {
    var hints = FactoryHints.reset().hints;
    this.codeMirrorView = new CodeMirrorView({
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

  _updateEditorContent: function () {
    this.codeMirrorView.setContent(this._layerDefinitionModel.get('sql'));
  },

  _triggerCodeSaved: function (code, view) {
    this.options.onApplyEvent && this.options.onApplyEvent();
  }
});
