var _ = require('underscore');
var CoreView = require('backbone/core-view');
var CodeMirrorView = require('../../../../components/code-mirror/code-mirror-view');
var ErrorTemplate = require('./code-mirror-error.tpl');

var REQUIRED_OPTS = [
  'codemirrorModel',
  'onApplyEvent'
];

var PLACEHOLDER = '[[Legend]]';

module.exports = CoreView.extend({

  className: 'Editor-content',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
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
      tip: _t('editor.legend.code-mirror.save'),
      errorTemplate: ErrorTemplate
    });

    this.codeMirrorView.bind('codeSaved', this._triggerCodeSaved, this);
    this.addView(this.codeMirrorView);
    this.$el.append(this.codeMirrorView.render().el);

    this._markReadOnly();
  },

  _markReadOnly: function () {
    var cursor = this.codeMirrorView.search(PLACEHOLDER);
    this.codeMirrorView.markReadOnly(cursor.from, cursor.to);
  },

  _triggerCodeSaved: function (code, view) {
    this.options.onApplyEvent && this.options.onApplyEvent();
  }
});
