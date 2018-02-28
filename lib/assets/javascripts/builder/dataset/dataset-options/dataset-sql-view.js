var CoreView = require('backbone/core-view');
var CodeMirrorView = require('builder/components/code-mirror/code-mirror-view');
var ErrorTemplate = require('./code-mirror-error.tpl');
var FactoryHints = require('builder/editor/editor-hints/factory-hints');
var SQLHints = require('builder/editor/editor-hints/sql-hints');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'codemirrorModel',
  'onApplyEvent',
  'querySchemaModel',
  'layerDefinitionModel'
];

module.exports = CoreView.extend({
  module: 'dataset:dataset-options:dataset-sql-view',

  className: 'Editor-content Dataset-editor',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

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
      tips: [
        _t('editor.data.code-mirror.tip')
      ],
      errorTemplate: ErrorTemplate
    });

    this.codeMirrorView.bind('codeSaved', this._triggerCodeSaved, this);
    this.addView(this.codeMirrorView);
    this.$el.append(this.codeMirrorView.render().el);
  },

  _triggerCodeSaved: function (code, view) {
    this._onApplyEvent && this._onApplyEvent();
  }
});
