var CoreView = require('backbone/core-view');
var CodeMirrorView = require('builder/components/code-mirror/code-mirror-view');
var ErrorTemplate = require('./code-mirror-error.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'codemirrorModel',
  'onApplyEvent'
];

module.exports = CoreView.extend({
  module: 'editor:layers:layer-content-views:infowindow:infowindow-html-view',

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
      tips: [
        _t('editor.infowindow.code-mirror.save'),
        _t('editor.infowindow.code-mirror.sanitize')
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
