var CoreView = require('backbone/core-view');
var CodeMirrorView = require('../../../../components/code-mirror/code-mirror-view');
var ErrorTemplate = require('./code-mirror-error.tpl');
var checkAndBuildOpts = require('../../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'codemirrorModel',
  'onApplyEvent'
];

module.exports = CoreView.extend({
  className: 'Editor-content',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
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
      tip: _t('editor.infowindow.code-mirror.save') + '<br>' + _t('editor.infowindow.code-mirror.sanitize'),
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
