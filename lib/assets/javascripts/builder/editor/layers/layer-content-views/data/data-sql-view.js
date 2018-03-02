var CoreView = require('backbone/core-view');
var CodeMirrorView = require('builder/components/code-mirror/code-mirror-view');
var ErrorTemplate = require('./code-mirror-error.tpl');
var FactoryHints = require('builder/editor/editor-hints/factory-hints');
var SQLHints = require('builder/editor/editor-hints/sql-hints');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'layerDefinitionModel',
  'querySchemaModel',
  'codemirrorModel',
  'onApplyEvent'
];

module.exports = CoreView.extend({
  module: 'editor:layers:layer-content-views:data-sql-view',

  className: 'Editor-dataContentSQL Editor-content',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

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
      tips: [
        _t('editor.data.code-mirror.tip')
      ],
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
    this._onApplyEvent && this._onApplyEvent();
  }
});
